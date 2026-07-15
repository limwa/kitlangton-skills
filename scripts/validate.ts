const root = new URL("../skills/effect/", import.meta.url)
const skill = await Bun.file(new URL("SKILL.md", root)).text()

if (!skill.startsWith("---\n")) throw new Error("SKILL.md must start with YAML frontmatter")
if (!skill.match(/^name: effect$/m)) throw new Error("Skill name must match its directory")
if (!skill.match(/^description: /m)) throw new Error("Skill description is required")

const references = [...skill.matchAll(/`(references\/[^`]+\.md)`/g)].map((match) => match[1])
const missing = await Promise.all(
  references.map(async (reference) => [reference, await Bun.file(new URL(reference, root)).exists()] as const),
).then((results) => results.filter(([, exists]) => !exists).map(([reference]) => reference))

if (missing.length > 0) throw new Error(`Missing references: ${missing.join(", ")}`)
console.log(`Validated Effect skill and ${references.length} references`)
