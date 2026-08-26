use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Operator {
    Eq,
    Ne,
    Gt,
    Lt,
    Gte,
    Lte,
    In,
    NotIn,
    Contains,
}

impl Operator {
    pub fn to_sql(&self) -> &'static str {
        match self {
            Operator::Eq => "=",
            Operator::Ne => "!=",
            Operator::Gt => ">",
            Operator::Lt => "<",
            Operator::Gte => ">=",
            Operator::Lte => "<=",
            Operator::In => "IN",
            Operator::NotIn => "NOT IN",
            Operator::Contains => "LIKE",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Condition {
    pub field: String,
    pub operator: Operator,
    pub value: JqlValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum JqlValue {
    String(String),
    Number(f64),
    Boolean(bool),
    List(Vec<String>),
    Null,
    CurrentUser,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedQuery {
    pub conditions: Vec<Condition>,
    pub order_by: Option<String>,
    pub order_dir: Option<String>, // "ASC" or "DESC"
    pub limit: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseError {
    pub message: String,
    pub position: usize,
}

const SUPPORTED_FIELDS: &[&str] = &[
    "status", "assignee", "reporter", "priority", "type", "project",
    "epic", "sprint", "label", "created", "updated", "due",
    "story_points", "resolution",
];

const SPECIAL_FUNCTIONS: &[&str] = &["currentUser", "currentuser()", "now", "today"];

pub fn parse_jql(query: &str) -> Result<ParsedQuery, ParseError> {
    let query = query.trim();
    if query.is_empty() {
        return Ok(ParsedQuery { conditions: vec![], order_by: None, order_dir: None, limit: None });
    }

    let mut conditions = Vec::new();
    let mut order_by = None;
    let mut order_dir = None;
    let mut limit = None;

    let mut remaining = query.to_string();

    // Extract ORDER BY clause
    if let Some(idx) = find_keyword(&remaining, "ORDER BY") {
        let (before, after) = remaining.split_at(idx);
        let before_str = before.trim().to_string();
        let order_str: String = after["ORDER BY".len()..].trim().to_string();
        remaining = before_str;

        if let Some(space_idx) = order_str.find(' ') {
            let field = order_str[..space_idx].trim().to_string();
            let dir = order_str[space_idx+1..].trim().to_uppercase();
            order_by = Some(field);
            order_dir = Some(if dir.starts_with("DESC") { "DESC".to_string() } else { "ASC".to_string() });
        } else {
            order_by = Some(order_str);
            order_dir = Some("ASC".to_string());
        }
    }

    // Extract LIMIT clause
    if let Some(idx) = find_keyword(&remaining, "LIMIT") {
        let (before, after) = remaining.split_at(idx);
        let before_str = before.trim().to_string();
        let limit_str: String = after["LIMIT".len()..].trim().to_string();
        remaining = before_str;
        if let Ok(n) = limit_str.parse::<i64>() {
            limit = Some(n);
        }
    }

    // Parse conditions separated by AND/OR
    let parts = split_logical(&remaining);
    for part in parts {
        let cond = parse_condition(part.trim())?;
        conditions.push(cond);
    }

    Ok(ParsedQuery { conditions, order_by, order_dir, limit })
}

fn find_keyword(s: &str, keyword: &str) -> Option<usize> {
    let upper = s.to_uppercase();
    upper.find(keyword)
}

fn split_logical(s: &str) -> Vec<&str> {
    let mut parts = Vec::new();
    let mut last = 0;
    let bytes = s.as_bytes();
    let mut i = 0;
    let mut in_string = false;

    while i < bytes.len() {
        let c = bytes[i];
        if c == b'"' || c == b'\'' {
            in_string = !in_string;
        } else if !in_string {
            // Check for AND as whole word
            if (c == b'A' || c == b'a') && i + 3 <= bytes.len() {
                let prev_is_space = i == 0 || bytes[i-1] == b' ';
                let next_is_space = i+3 == bytes.len() || bytes[i+3] == b' ';
                if prev_is_space && next_is_space
                    && (bytes[i+1] == b'N' || bytes[i+1] == b'n')
                    && (bytes[i+2] == b'D' || bytes[i+2] == b'd')
                {
                    parts.push(&s[last..i]);
                    last = i + 3;
                    i += 3;
                    continue;
                }
            }
            // Check for OR as whole word
            if (c == b'O' || c == b'o') && i + 2 <= bytes.len() {
                let prev_is_space = i == 0 || bytes[i-1] == b' ';
                let next_is_space = i+2 == bytes.len() || bytes[i+2] == b' ';
                if prev_is_space && next_is_space
                    && (bytes[i+1] == b'R' || bytes[i+1] == b'r')
                {
                    parts.push(&s[last..i]);
                    last = i + 2;
                    i += 2;
                    continue;
                }
            }
        }
        i += 1;
    }
    parts.push(&s[last..]);
    parts
}

fn parse_condition(s: &str) -> Result<Condition, ParseError> {
    let s = s.trim();
    if s.is_empty() {
        return Err(ParseError { message: "Empty condition".to_string(), position: 0 });
    }

    // Find operator position
    let ops = ["!=", ">=", "<=", "=", ">", "<", " IN ", " NOT IN ", " CONTAINS "];
    let mut op_pos = None;
    let mut op_str = "";

    for op in &ops {
        if let Some(idx) = s.find(op) {
            if op_pos.is_none() || idx < op_pos.unwrap() {
                op_pos = Some(idx);
                op_str = op.trim();
            }
        }
    }

    let op_pos = op_pos.ok_or_else(|| ParseError {
        message: format!("No operator found in: '{}'", s),
        position: 0,
    })?;

    let field = s[..op_pos].trim().to_string();
    let raw_value = s[op_pos + op_str.len()..].trim();

    // Validate field
    let field_lower = field.to_lowercase();
    if !SUPPORTED_FIELDS.contains(&field_lower.as_str()) {
        return Err(ParseError {
            message: format!("Unsupported field: '{}'", field),
            position: 0,
        });
    }

    let operator = match op_str.to_uppercase().as_str() {
        "=" => Operator::Eq,
        "!=" => Operator::Ne,
        ">" => Operator::Gt,
        "<" => Operator::Lt,
        ">=" => Operator::Gte,
        "<=" => Operator::Lte,
        "IN" => Operator::In,
        "NOT IN" => Operator::NotIn,
        "CONTAINS" => Operator::Contains,
        _ => return Err(ParseError { message: format!("Unknown operator: '{}'", op_str), position: op_pos }),
    };

    let value = parse_value(raw_value)?;

    Ok(Condition { field, operator, value })
}

fn parse_value(s: &str) -> Result<JqlValue, ParseError> {
    let s = s.trim();
    if s.is_empty() {
        return Ok(JqlValue::Null);
    }

    // Check for special functions
    let s_lower = s.to_lowercase();
    if s_lower == "currentuser()" || s_lower == "currentuser" {
        return Ok(JqlValue::CurrentUser);
    }

    // String in quotes
    if (s.starts_with('"') && s.ends_with('"')) || (s.starts_with('\'') && s.ends_with('\'')) {
        let inner = &s[1..s.len()-1];
        return Ok(JqlValue::String(inner.to_string()));
    }

    // List in parentheses
    if s.starts_with('(') && s.ends_with(')') {
        let inner = &s[1..s.len()-1];
        let items: Vec<String> = inner.split(',')
            .map(|x| x.trim().trim_matches('"').trim_matches('\'').to_string())
            .filter(|x| !x.is_empty())
            .collect();
        return Ok(JqlValue::List(items));
    }

    // Number
    if let Ok(n) = s.parse::<f64>() {
        return Ok(JqlValue::Number(n));
    }

    // Boolean
    if s_lower == "true" || s_lower == "false" {
        return Ok(JqlValue::Boolean(s_lower == "true"));
    }

    // Plain string (unquoted)
    Ok(JqlValue::String(s.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_eq() {
        let q = parse_jql("status = \"done\"").unwrap();
        assert_eq!(q.conditions.len(), 1);
        assert_eq!(q.conditions[0].field, "status");
        assert_eq!(q.conditions[0].operator, Operator::Eq);
        assert_eq!(q.conditions[0].value, JqlValue::String("done".to_string()));
    }

    #[test]
    fn test_and() {
        let q = parse_jql("status = \"done\" AND priority = \"high\"").unwrap();
        assert_eq!(q.conditions.len(), 2);
    }

    #[test]
    fn test_in() {
        let q = parse_jql("status IN (\"todo\", \"in_progress\")").unwrap();
        assert_eq!(q.conditions[0].operator, Operator::In);
        if let JqlValue::List(items) = &q.conditions[0].value {
            assert_eq!(items.len(), 2);
        } else {
            panic!("Expected list");
        }
    }

    #[test]
    fn test_current_user() {
        let q = parse_jql("assignee = currentUser()").unwrap();
        assert_eq!(q.conditions[0].value, JqlValue::CurrentUser);
    }

    #[test]
    fn test_order_by() {
        let q = parse_jql("status = \"done\" ORDER BY created_at DESC").unwrap();
        assert_eq!(q.order_by, Some("created_at".to_string()));
        assert_eq!(q.order_dir, Some("DESC".to_string()));
    }

    #[test]
    fn test_limit() {
        let q = parse_jql("status = \"done\" LIMIT 10").unwrap();
        assert_eq!(q.limit, Some(10));
    }
}
