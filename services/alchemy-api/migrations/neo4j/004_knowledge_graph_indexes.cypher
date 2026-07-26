CREATE INDEX canonical_entity_review IF NOT EXISTS
FOR (n:CanonicalEntity) ON (n.review_status);

CREATE INDEX canonical_entity_production IF NOT EXISTS
FOR (n:CanonicalEntity) ON (n.production_eligible);

CREATE INDEX source_production_status IF NOT EXISTS
FOR (n:Source) ON (n.production_status);

CREATE INDEX source_release_lookup IF NOT EXISTS
FOR (n:SourceRelease) ON (n.source_id, n.release_id);

CREATE INDEX source_release_production IF NOT EXISTS
FOR (n:SourceRelease) ON (n.production_eligible);

CREATE INDEX source_record_lookup IF NOT EXISTS
FOR (n:SourceRecord) ON (n.source_id, n.release_id);

CREATE INDEX source_record_external_id IF NOT EXISTS
FOR (n:SourceRecord) ON (n.external_id);

CREATE INDEX source_record_production IF NOT EXISTS
FOR (n:SourceRecord) ON (n.production_eligible);

CREATE INDEX mapping_assertion_status IF NOT EXISTS
FOR (n:MappingAssertion) ON (n.status);

CREATE INDEX mapping_assertion_method IF NOT EXISTS
FOR (n:MappingAssertion) ON (n.method);

CREATE INDEX external_identifier_lookup IF NOT EXISTS
FOR (n:ExternalIdentifier) ON (n.scheme, n.value);

CREATE INDEX taxon_scientific_name IF NOT EXISTS
FOR (n:Taxon) ON (n.scientific_name);

CREATE INDEX compound_inchikey IF NOT EXISTS
FOR (n:Compound) ON (n.inchikey);

CREATE INDEX publication_doi IF NOT EXISTS
FOR (n:Publication) ON (n.doi);

CREATE INDEX publication_pmid IF NOT EXISTS
FOR (n:Publication) ON (n.pmid);

CREATE INDEX formula_concept_review IF NOT EXISTS
FOR (n:FormulaConcept) ON (n.review_status);

CREATE INDEX medicinal_material_review IF NOT EXISTS
FOR (n:MedicinalMaterial) ON (n.review_status);

CREATE INDEX observation_review IF NOT EXISTS
FOR (n:BioactivityObservation) ON (n.review_status);

CREATE INDEX projection_version IF NOT EXISTS
FOR (n:GraphProjection) ON (n.version);

CREATE FULLTEXT INDEX medicinal_material_names_v2 IF NOT EXISTS
FOR (n:MedicinalMaterial|Alias|CanonicalName)
ON EACH [n.display_name, n.normalized, n.aliases_search];

CREATE FULLTEXT INDEX formula_names_v2 IF NOT EXISTS
FOR (n:FormulaConcept|FormulaWitness|Alias)
ON EACH [n.display_name, n.normalized, n.aliases_search];

CREATE FULLTEXT INDEX botanical_names_v2 IF NOT EXISTS
FOR (n:Taxon|BotanicalTaxon|Alias)
ON EACH [n.display_name, n.scientific_name, n.normalized];

CREATE FULLTEXT INDEX compound_names_v2 IF NOT EXISTS
FOR (n:Compound|Alias)
ON EACH [n.display_name, n.normalized, n.aliases_search];

CREATE FULLTEXT INDEX disease_names_v2 IF NOT EXISTS
FOR (n:DiseaseConcept|Alias|CanonicalName)
ON EACH [n.display_name, n.normalized, n.aliases_search];
