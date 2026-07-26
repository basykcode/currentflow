CREATE INDEX projection_built_at IF NOT EXISTS
FOR (n:GraphProjection) ON (n.built_at);
