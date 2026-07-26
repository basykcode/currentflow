CREATE CONSTRAINT canonical_entity_id IF NOT EXISTS
FOR (n:CanonicalEntity) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT external_identifier_id IF NOT EXISTS
FOR (n:ExternalIdentifier) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT canonical_name_id IF NOT EXISTS
FOR (n:CanonicalName) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT alias_id IF NOT EXISTS
FOR (n:Alias) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT mapping_assertion_id IF NOT EXISTS
FOR (n:MappingAssertion) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT medicinal_material_id IF NOT EXISTS
FOR (n:MedicinalMaterial) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT prepared_material_id IF NOT EXISTS
FOR (n:PreparedMaterial) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT preparation_method_id IF NOT EXISTS
FOR (n:PreparationMethod) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT taxon_id IF NOT EXISTS
FOR (n:Taxon) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT formula_concept_id IF NOT EXISTS
FOR (n:FormulaConcept) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT formula_witness_id IF NOT EXISTS
FOR (n:FormulaWitness) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT ingredient_use_id IF NOT EXISTS
FOR (n:IngredientUse) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT unit_id IF NOT EXISTS
FOR (n:Unit) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT chemical_class_id IF NOT EXISTS
FOR (n:ChemicalClass) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT gene_id IF NOT EXISTS
FOR (n:Gene) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT protein_id IF NOT EXISTS
FOR (n:Protein) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT protein_complex_id IF NOT EXISTS
FOR (n:ProteinComplex) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT pathway_id IF NOT EXISTS
FOR (n:Pathway) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT reaction_id IF NOT EXISTS
FOR (n:Reaction) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT disease_concept_id IF NOT EXISTS
FOR (n:DiseaseConcept) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT publication_id IF NOT EXISTS
FOR (n:Publication) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT source_release_id IF NOT EXISTS
FOR (n:SourceRelease) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT source_record_id IF NOT EXISTS
FOR (n:SourceRecord) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT license_id IF NOT EXISTS
FOR (n:License) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT adapter_version_id IF NOT EXISTS
FOR (n:AdapterVersion) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT schema_version_id IF NOT EXISTS
FOR (n:SchemaVersion) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT mapping_version_id IF NOT EXISTS
FOR (n:MappingVersion) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT predicate_term_id IF NOT EXISTS
FOR (n:PredicateTerm) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT evidence_type_id IF NOT EXISTS
FOR (n:EvidenceType) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT assertion_method_id IF NOT EXISTS
FOR (n:AssertionMethod) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT compound_occurrence_id IF NOT EXISTS
FOR (n:CompoundOccurrence) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT bioactivity_observation_id IF NOT EXISTS
FOR (n:BioactivityObservation) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT toxicity_observation_id IF NOT EXISTS
FOR (n:ToxicityObservation) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT exposure_observation_id IF NOT EXISTS
FOR (n:ExposureObservation) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT clinical_evidence_record_id IF NOT EXISTS
FOR (n:ClinicalEvidenceRecord) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT prediction_id IF NOT EXISTS
FOR (n:Prediction) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT text_work_id IF NOT EXISTS
FOR (n:TextWork) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT edition_id IF NOT EXISTS
FOR (n:Edition) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT text_witness_id IF NOT EXISTS
FOR (n:TextWitness) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT graph_projection_id IF NOT EXISTS
FOR (n:GraphProjection) REQUIRE n.id IS UNIQUE;
