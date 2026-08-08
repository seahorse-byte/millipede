import { z } from "zod";

export const lessonTypes = [
  "lesson",
  "deep-dive",
  "interactive",
  "lab",
  "quiz",
  "recap",
  "instructor",
] as const;

export type LessonType = (typeof lessonTypes)[number];

export const lessonFrontmatterSchema = z.object({
  id: z.string().regex(/^\d+\.\d+([A-Z]\d+)?$/),
  book: z.number().int().min(0).max(7),
  title: z.string().min(1),
  type: z.enum(lessonTypes).default("lesson"),
  duration_min: z.number().int().positive().optional(),
  prerequisites: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  components: z.array(z.string()).default([]),
  quiz_id: z.string().optional(),
  lab_id: z.string().optional(),
  instructor_notes: z.boolean().default(false),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

export function parseLessonFrontmatter(data: unknown): LessonFrontmatter {
  return lessonFrontmatterSchema.parse(data);
}

export const widgetNames = [
  "BitRegister",
  "BaseConverter",
  "ByteAnatomy",
  "HexColorMixer",
  "PacketJourney",
  "StackFrameVisualizer",
  "BrowserRuntimeDiagram",
  "TrustBoundaryDiagram",
  "EventLoopSimulator",
  "OwnershipVisualizer",
  "BorrowCheckerPanel",
  "ConcurrencyChannels",
  "SendSyncExplorer",
  "TokioFutureMachine",
  "SolidSignalGraph",
  "TanStackDataFlow",
  "EventPatternComparison",
  "KafkaTopicExplorer",
  "KafkaMessageFlow",
  "ChainedConsumerDiagram",
  "PostgresSchemaDiagram",
  "RedisPubSubLive",
  "KafkaOffsetRewind",
  "ComposeNetworkMap",
  "PagesDeployFlow",
  "ZeroTrustTopology",
  "JwtValidationFlow",
  "CertAuthorityBootstrap",
  "FieldEncryptionPanel",
  "WasmRedaction",
  "PseudonymizationDemo",
  "SlackSignatureVerifier",
  "AbacRoleMatrix",
  "BffProxyFlow",
  "ApiWorkerSplit",
  "MonorepoMap",
  "EventSchemaExplorer",
  "AxumHandlerExplorer",
  "IngestionProducerPanel",
  "ConsumerLoopVisualizer",
  "WebhookToDbFlow",
  "RedisCacheWarmup",
  "TracingSpanTimeline",
  "RadarAppShell",
  "RadarMetricsPanel",
  "RadarRouterMap",
  "RadarLiveFeed",
  "RadarStage4Diagram",
  "GatewayScaffold",
  "GatewayProxyFlow",
  "LlmWorkerContainer",
  "PythonKafkaConsumer",
  "EnrichmentGraph",
  "SecuredPipelineCapstone",
  "WasmBoundary",
  "KafkaPipelineVisualizer",
  "RequestTimeline",
  "MtlsHandshake",
  "mTLSHandshake",
  "AgentEvalGate",
  "KpiDictionary",
  "QualitySystemsPanel",
  "EmMockClassFlow",
  "StackDecisionRubric",
] as const;

export type WidgetName = (typeof widgetNames)[number];

export const pageTypeDescriptions: Record<LessonType, string> = {
  lesson: "Core teaching + inline widgets",
  "deep-dive": "Optional 60-min rabbit hole (e.g. 3.11 BFF)",
  interactive: "Animation-first canvas",
  lab: "Hands-on exercise with verification",
  quiz: "5–10 questions, scored",
  recap: "Flashcards, teach-it-back",
  instructor: "Timing, talking points, rubric",
};
