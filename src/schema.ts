import { z } from "zod";
const strs = z.array(z.string());
const named = z.object({ id: z.string().min(1), name: z.string().min(1) });
export const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: strs,
  year: z.number(),
  journal: z.string(),
  doi: z.string(),
  pmid: z.string(),
  url: z.url(),
  fullTextUrl: z.url({ protocol: /^https?$/ }).optional(),
  accessScope: z.string(),
  metadataVerified: z.boolean(),
  claimVerified: z.boolean(),
  checkedDate: z.string(),
  correctionStatus: z.string(),
  type: z.string(),
});
export const evidenceSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  pathwayIds: strs.default([]),
  publicationId: z.string(),
  claim: z.string(),
  evidenceType: strs,
  species: strs,
  actualEntity: z.string(),
  tissueCell: z.string(),
  model: z.string(),
  intervention: z.string(),
  result: z.string(),
  endpoints: strs,
  conditions: z.string(),
  limitations: z.string(),
  supportStatus: z.string(),
  locator: z.string(),
  accessScope: z.string(),
  sourceUrl: z.url(),
  studyContext: z
    .enum(["aging_function", "nonaging_support", "observational"])
    .default("aging_function"),
  phenotypeIds: strs,
  interventionIds: strs,
  dose: z.string(),
  time: z.string(),
  sampleSize: z.string(),
});
export const targetSchema = named.extend({
  symbol: z.string(),
  entityType: z.enum(["gene_protein", "family", "complex"]),
  aliases: strs,
  externalIds: z.array(
    z.object({
      database: z.string(),
      id: z.string(),
      url: z.url(),
      checkedDate: z.string(),
    }),
  ),
  members: strs,
  orthologMapping: z.string(),
  summary: z.string(),
  taxonomyIds: strs,
  pathwayIds: strs,
  skinClassification: z.enum([
    "skin_aging",
    "skin_damage",
    "other_tissue",
    "not_assessed",
  ]),
  skinSummary: z.string(),
  evidenceIds: strs,
  status: z.literal("core"),
});
export const relationSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  relationType: z.enum([
    "activates",
    "inhibits",
    "phosphorylates",
    "binds",
    "indirect",
    "member_of",
    "associated_with",
  ]),
  polarity: z.enum([
    "positive",
    "negative",
    "mixed",
    "unknown",
    "not_applicable",
  ]),
  directness: z.string(),
  evidenceIds: strs,
  backgroundSourceIds: strs,
  context: z.string(),
  scope: z.enum(["aging_experiment", "pathway_background"]),
  label: z.string(),
  direction: z.enum(["directed", "undirected"]),
});
export const pathwayMapSchema = z.object({
  pathwayId: z.string(),
  tracks: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    scope: z.enum(["standard", "experiment", "observation"]),
    context: z.string().min(1),
    nodes: z.array(z.object({
      id: z.string().min(1), label: z.string().min(1),
      kind: z.enum(["target", "input", "process", "outcome"]),
      col: z.number().int().min(0).max(6), row: z.number().int().min(0).max(3).default(0),
      note: z.string().optional(), targetId: z.string().optional(),
      gene: z.object({ symbol: z.string(), name: z.string(), url: z.url({protocol: /^https$/}) }).optional(),
    })).min(2),
    edges: z.array(z.object({
      from: z.string(), to: z.string(), label: z.string().min(1),
      kind: z.enum(["activation", "inhibition", "process", "association"]),
      detail: z.string().min(1),
      refs: z.array(z.union([z.string().min(1), z.object({title: z.string().min(1), url: z.url({protocol: /^https$/})})])).min(1),
    })).min(1),
  })).min(1),
});
export const atlasSchema = z.object({
  taxonomy: z.array(
    named.extend({
      englishName: z.string(),
      number: z.number(),
      description: z.string(),
      sourceId: z.string(),
      version: z.string(),
      color: z.string(),
      kind: z.enum(["hallmark", "extension"]).default("hallmark"),
      summary: z.string().optional(),
      scopeNote: z.string().optional(),
      evidenceIds: strs.default([]),
      sections: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            body: z.string(),
            sourceIds: strs,
          }),
        )
        .default([]),
    }),
  ),
  targets: z.array(targetSchema),
  complexes: z.array(
    named.extend({
      entityType: z.literal("complex"),
      summary: z.string(),
      memberIds: strs,
      membersNote: z.string(),
      sourceIds: strs,
    }),
  ),
  pathways: z.array(
    named.extend({
      summary: z.string(),
      memberIds: strs,
      taxonomyIds: strs,
      backgroundSourceIds: strs,
      relationIds: strs,
      mappingBasis: z.string(),
      reference: z.object({ database: z.string(), id: z.string(), url: z.url() }).optional(),
    }),
  ),
  pathwayMaps: z.array(pathwayMapSchema).default([]),
  phenotypes: z.array(
    named.extend({
      level: z.string(),
      definition: z.string(),
      sourceIds: strs,
    }),
  ),
  interventions: z.array(
    named.extend({
      category: z.string(),
      identity: z.string(),
      targetIds: strs,
      evidenceIds: strs,
      route: z.string(),
    }),
  ),
  publications: z.array(publicationSchema),
  evidence: z.array(evidenceSchema),
  themeStudies: z.array(z.object({
    id: z.string(), pathwayId: z.string(), publicationId: z.string(),
    subject: z.string(), claim: z.string(), species: strs, model: z.string(),
    intervention: z.string(), result: z.string(), locator: z.string(),
    evidenceType: z.string(),
    studyContext: z.enum(["aging_function", "nonaging_support", "observational"]),
  })).default([]),
  coveragePlan: z.array(z.object({
    taxonomyId: z.string(),
    topics: z.array(z.object({
      name: z.string(), pathwayIds: strs, candidateSymbols: strs,
    })),
  })).default([]),
  relations: z.array(relationSchema),
  sources: z.array(
    named.extend({ url: z.url(), role: z.string(), checkedDate: z.string() }),
  ),
  manifest: z.object({
    version: z.string(),
    updated: z.string(),
    counts: z.record(z.string(), z.number()),
    coverage: z.string(),
    gaps: strs,
    reviewStatus: z.string(),
    searchScope: z.string(),
  }),
});
export type Atlas = z.infer<typeof atlasSchema>;
export type Target = Atlas["targets"][number];
export type Evidence = Atlas["evidence"][number];
export type Publication = Atlas["publications"][number];
export type Relation = Atlas["relations"][number];
export type PathwayMap = Atlas["pathwayMaps"][number];
export type MapTrack = PathwayMap["tracks"][number];
