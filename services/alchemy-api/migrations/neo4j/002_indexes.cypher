CREATE INDEX herb_review_status IF NOT EXISTS
FOR (n:HerbMaterial) ON (n.review_status);

CREATE INDEX formula_review_status IF NOT EXISTS
FOR (n:Formula) ON (n.review_status);

CREATE INDEX source_rights_status IF NOT EXISTS
FOR (n:Source) ON (n.rights_status);

CREATE INDEX source_review_status IF NOT EXISTS
FOR (n:Source) ON (n.review_status);

CREATE INDEX claim_review_status IF NOT EXISTS
FOR (n:Claim) ON (n.review_status);

CREATE INDEX claim_predicate IF NOT EXISTS
FOR (n:Claim) ON (n.predicate);

CREATE INDEX import_run_started_at IF NOT EXISTS
FOR (n:ImportRun) ON (n.started_at);

CREATE INDEX document_source_id IF NOT EXISTS
FOR (n:Document) ON (n.source_id);

CREATE INDEX passage_document_id IF NOT EXISTS
FOR (n:Passage) ON (n.document_id);

CREATE FULLTEXT INDEX herb_names IF NOT EXISTS
FOR (n:HerbMaterial) ON EACH [n.display_name, n.aliases_search];

CREATE FULLTEXT INDEX formula_names IF NOT EXISTS
FOR (n:Formula) ON EACH [n.display_name, n.aliases_search];

CREATE FULLTEXT INDEX document_passage_text IF NOT EXISTS
FOR (n:Document|Passage) ON EACH [n.title, n.normalized_text, n.original_text];
