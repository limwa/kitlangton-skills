import { Cache, Config, ConfigProvider, Data, Duration, Effect, Exit, Layer, Option, Schedule, Schema, Stream } from "effect"
import { HttpClientRequest, HttpClientResponse } from "effect/unstable/http"

const UserId = Schema.NonEmptyString.pipe(Schema.brand("UserId"))
const User = Schema.Struct({ id: UserId, name: Schema.NonEmptyString })
interface User extends Schema.Schema.Type<typeof User> {}

type Step = Data.TaggedEnum<{
  Continue: { readonly cursor: number }
  Finished: { readonly count: number }
}>
const Step = Data.taggedEnum<Step>()
Step.$match(Step.Continue({ cursor: 1 }), {
  Continue: ({ cursor }) => cursor,
  Finished: ({ count }) => count,
})

const retrySchedule = Schedule.exponential("200 millis").pipe(
  Schedule.jittered,
  Schedule.upTo({ times: 5 }),
  Schedule.passthrough,
  Schedule.modifyDelay(({ input, duration }: Schedule.Metadata<unknown, { readonly retryAfterMs?: number }>) =>
    Effect.succeed(
      input.retryAfterMs === undefined
        ? duration
        : Duration.max(duration, Duration.millis(input.retryAfterMs)),
    )),
)

const cache = Cache.makeWith(
  (key: string) => Effect.succeed({ key, cacheable: true }),
  {
    capacity: 100,
    timeToLive: (exit) => Exit.isSuccess(exit) && exit.value.cacheable ? "10 minutes" : Duration.zero,
  },
)

const configLayer = ConfigProvider.layer(ConfigProvider.fromUnknown({ FEATURE_ENABLED: "true" }))
const enabled = Config.boolean("FEATURE_ENABLED").pipe(Config.withDefault(false))
const stream = Stream.paginate(0, (page) => Effect.succeed([[page], page < 2 ? Option.some(page + 1) : Option.none()]))
const request = HttpClientRequest.get("https://example.com").pipe(HttpClientRequest.acceptJson)
const response = HttpClientResponse.schemaBodyJson(User)

void retrySchedule
void cache
void configLayer
void enabled
void stream
void request
void response
void Layer.empty
