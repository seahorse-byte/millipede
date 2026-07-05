import { defineCollection, z } from "astro:content";
import { lessonFrontmatterSchema } from "@millipede/mdx-schema";

const lessons = defineCollection({
  type: "content",
  schema: lessonFrontmatterSchema,
});

export const collections = { lessons };
