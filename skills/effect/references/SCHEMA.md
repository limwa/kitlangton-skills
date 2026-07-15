# Schema And Data Modeling

Use this when touching data models, DTOs, row schemas, wire contracts, brands, variants, optional fields, or decoders.

## Records

Default to `Schema.Struct(...)` plus a same-name `interface`.

```ts
export const User = Schema.Struct({
  id: UserId,
  name: Schema.NonEmptyString,
  email: Schema.optionalKey(Schema.String),
})

export interface User extends Schema.Schema.Type<typeof User> {}
```

Guidance:

- Add `.annotate({ identifier: "User" })` only when tooling consumes it: HTTP API, RPC, OpenAPI/JSON Schema, docs, diagnostics, or codegen.
- Use `schema.make(...)` when construction is trusted.
- Use `schema.makeEffect(...)` when construction failure should stay in the Effect error channel.
- Decode unknown input at boundaries with `Schema.decodeUnknownEffect(...)` by default.
- Use `Schema.decodeUnknownSync(...)` only in scripts, tests, or startup paths where throwing is acceptable.
- Use `Schema.decodeUnknownOption(...)` only when mismatch details are intentionally discarded.
- Use `Schema.decodeUnknownResult(...)` for pure code that wants explicit success/failure without Effect.

## Field And Contract Reuse

Reuse fields directly when contracts are semantically related.

```ts
export const CreateUserInput = Schema.Struct({
  name: User.fields.name,
  email: User.fields.email,
})

export const StoredUser = User.pipe(
  Schema.fieldsAssign({
    createdAt: Schema.DateTimeUtcFromString,
  }),
)
```

Guidance:

- Use `.fields`, `Schema.fieldsAssign(...)`, and `.mapFields(...)` when contracts are genuinely related.
- Use `Schema.encodeKeys(...)` when decoded TypeScript names differ from encoded wire/storage keys and naming is the only difference.
- Keep explicit mapping when behavior, joins, validation, or domain translation is involved.
- Use `Schema.extendTo(...)` sparingly for decoded-only derived fields.
- Use field reuse to build small related contracts, not one oversized inheritance-by-schema object.

## Optionality And Defaults

- Use `Schema.optionalKey(...)` for absent JSON/storage keys.
- Use `Schema.optional(...)` only when explicit `undefined` is part of the contract.
- Use `Schema.NullOr`, `Schema.UndefinedOr`, or `Schema.NullishOr` only when nullish values are truly part of the encoded contract.
- Keep normalized defaulted values as required fields and apply defaults in constructors/decoding.
- Do not make domain values optional merely for construction convenience.

## Nominal Values

- Prefer the project's schema-backed `Newtype` helper for scalar IDs and value objects when one exists.
- Use constrained branded schemas as the portable fallback.
- Use normal schema constraints before `Schema.brand(...)` for most code.
- Reach for `Schema.fromBrand(...)` only when the project already models brands with `Brand` constructors or wants the check packaged with the brand constructor.
- Do not use `Schema.Opaque` to implement primitive newtypes. It is the object-model abstraction; primitive class inheritance is not supported by TypeScript.

Keep custom `Newtype` helpers project-local. Helpers that reconstruct `Schema.Bottom`, access `~type.*` members, mutate class prototypes, or cast a schema to a constructor depend on internal type structure and can break between Effect v4 releases. If a project deliberately adopts such a helper, pin the Effect version and test construction, nominal separation, nested decoding/encoding, schema rebuilding, and invalid-input rejection.

## Variants

```ts
type Step = Data.TaggedEnum<{
  Continue: { readonly cursor: number }
  Finished: { readonly count: number }
}>

export const Step = Data.taggedEnum<Step>()

const next = Step.Continue({ cursor: 10 })
const label = Step.$match(next, {
  Continue: ({ cursor }) => `continue at ${cursor}`,
  Finished: ({ count }) => `finished ${count}`,
})
```

```ts
export const Event = Schema.TaggedUnion({
  Started: { runId: RunId },
  Finished: { runId: RunId, result: Schema.Json },
})

export type Event = typeof Event.Type

const event = Event.cases.Started.make({ runId })
const label = Event.match(event, {
  Started: ({ runId }) => `started ${runId}`,
  Finished: ({ runId }) => `finished ${runId}`,
})
```

Guidance:

- Use `Data.TaggedEnum` for internal control-flow algebras; it provides constructors, `$is`, and exhaustive `$match`. Do not add a Schema solely to obtain these utilities.
- Use `Schema.TaggedStruct` for reusable variants that need runtime schema behavior.
- Use `Schema.TaggedUnion` when the union needs decoding, encoding, persistence, wire validation, JSON Schema derivation, or schema composition.
- Prefer a principled split over forcing one representation everywhere: Data internally, Schema at boundaries.
- For custom discriminants, use `Schema.Struct({ kind: Schema.tag(...) })` plus `Schema.toTaggedUnion("kind")`.
- If the encoded contract omits the discriminant, use `Schema.tagDefaultOmit(...)` deliberately.
- Avoid `Schema.Class` and `Schema.TaggedClass` for new data models.

## Principal Values And Statics

When one schema is the principal value and related constructors, IDs, refs, and pure queries are tightly attached, follow the project's `statics(...)`-style house pattern if the codebase has one.

Use this for one principal concept with facets such as `Message.Ref`, `Message.Id`, or `Message.mentionsUser(...)`.

Do not force this shape onto bags of co-equal concepts. A module such as `Channel` with `Ref`, `Message`, `Service`, and multiple errors is better as a namespace-bag barrel.

## Errors

`Schema.TaggedErrorClass` is the explicit class exception for typed Effect errors.

```ts
export class PersistenceError extends Schema.TaggedErrorClass<PersistenceError>()(
  "UserRepo.PersistenceError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}
```

Guidance:

- Map infrastructure failures into domain-specific tagged errors at service boundaries.
- Include operation labels when they help diagnose adapter, persistence, provider, or transport failures.
- Use schema unions for public API or transport error surfaces.
- Use `Schema.Defect()` for defect-like payloads.
- Preserve interruption when catching broad causes at ingress, worker, or stream boundaries.
