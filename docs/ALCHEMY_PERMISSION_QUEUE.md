# Alchemy permission queue

Permission-pending sources are planning records only. No acquisition, normalization, graph load, or
production projection is authorized until the queue item has written evidence and a reviewed
release manifest.

| Source | Intended value | Required resolution |
| --- | --- | --- |
| HERB | TCM materials, formulas, targets, diseases | Written commercial/redistribution/database rights and release access |
| ETCM | Formula/herb/compound relationships | Written reuse, derivative, and redistribution permission |
| SymMap | TCM-modern medicine mappings | Resolve current access and commercial derivative terms |
| TCMBank | Ingredients, targets, disease associations | Confirm dataset license and redistribution scope |
| BATMAN-TCM | Herb/formula target predictions | Permission plus prediction-labeling and redistribution rules |
| TCMID | TCM formula and ingredient records | Written commercial database permission |
| DCABM-TCM | Mechanism and association records | License evidence and machine-access permission |
| HerbComb | Herb combinations and evidence | Commercial/redistribution permission and release snapshot |
| CTEXT | Classical text passages/metadata | API/text reuse limits, attribution, and commercial terms |
| CBETA | Buddhist/Chinese textual witnesses | Corpus-specific license, attribution, and redistribution review |

## Minimum approval packet

- source owner/licensor identity and contact;
- exact dataset/corpus and release;
- allowed acquisition method and authentication boundary;
- commercial, redistribution, derivative-database, and AI/ML terms;
- attribution and share-alike obligations;
- text/row limits and territory/expiry where applicable;
- written evidence stored outside Git when confidential, with a non-confidential reference;
- approved source-registry update and immutable release manifest;
- enabled adapter fixture, tests, dry-run report, and rights audit.

An unclear response stays pending. A refusal or incompatible restriction becomes blocked. A source
cannot be made eligible by copying facts through another unlicensed site.
