"""Unit tests for backend-style validators ported to Python."""

from __future__ import annotations

import re
import unittest


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(value: str) -> bool:
    if not value:
        return False
    if len(value) > 254:
        return False
    if value != value.strip():
        return False
    if " " in value or "\t" in value or "\n" in value:
        return False
    if value.count("@") != 1:
        return False
    local, _, domain = value.partition("@")
    if not local or not domain:
        return False
    if "." not in domain or domain.startswith(".") or domain.endswith("."):
        return False
    return bool(_EMAIL_RE.match(value))


class TestValidateEmail(unittest.TestCase):
    def test_accepts_normal_addresses(self):
        for e in ["a@b.co", "user@example.com", "first.last@sub.example.org"]:
            self.assertTrue(is_valid_email(e), e)

    def test_rejects_garbage(self):
        for bad in ["", "no-at-sign", "@nodomain.com", "no@dot", "user@", "@", "a@b", " user@x.com", "user @x.com"]:
            self.assertFalse(is_valid_email(bad), repr(bad))

    def test_rejects_too_long(self):
        self.assertFalse(is_valid_email("a" * 250 + "@x.com"))

    def test_accepts_max_length(self):
        # 64 local + @ + 254-ish domain capped at 254 total
        local = "a" * 60
        domain = "x" * 180 + ".com"
        email = f"{local}@{domain}"
        if len(email) <= 254:
            self.assertTrue(is_valid_email(email))


if __name__ == "__main__":
    unittest.main()
