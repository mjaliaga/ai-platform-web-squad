UPDATE tasks SET type = 'tarea' WHERE type IN ('task', 'story', 'epic');
UPDATE tasks SET type = 'bug' WHERE type = 'bug';
