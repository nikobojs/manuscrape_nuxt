<template>
  <div>
    <div>
      <div
        class="[&_h2]:flex [&_h2]:items-center [&_h2_span]:text-4xl [&_h2]:gap-2 [&_h2_span]:text-green-500 grid grid-cols-3 gap-x-6 [&_strong]:font-semibold [&_h2]:text-xl [&_p]:text-sm [&_li]:text-sm [&_h2]:mb-4 [&_p]:mb-3 [&_ul]:mb-3 [&_li]:list-disc [&_ul]:pl-3"
      >
        <SubCard class="w-full">
          <h2>
            <UIcon name="heroicons:device-tablet" />
            Event based
          </h2>
          <p>
            Event‑based ethnography focuses on a single, clearly defined
            occurrence. This might be a specific post (e.g., an ad for an
            illegal activity) or an interaction (e.g., discussion triggered by
            posting a meme). Such events are typically documented using
            screenshots or screen recordings.
          </p>
          <p>The analytical focus can be:</p>
          <ul>
            <li>
              <strong>Descriptive</strong>: documenting that the event occurred
              and what happened.
            </li>
            <li>
              <strong>Analytical</strong>: conducting a micro‑sociological
              analysis of the interaction itself.
            </li>
          </ul>
          <p>
            Context is defined by what is observable within the immediate
            temporal and spatial surroundings of the event. Output often
            includes <strong>quantitative descriptions</strong> of content and
            how it varies across many similar events.
          </p>
          <template #bottom>
            <div class="flex justify-center">
              <UButton
                variant="outline"
                class="bg-green-950/50 hover:bg-green-950"
                size="xl"
                @click="() => selectTemplate('event-based')"
              >
                Select template
              </UButton>
            </div>
          </template>
        </SubCard>
        <SubCard class="w-full">
          <h2>
            <UIcon name="heroicons:clipboard-document" />
            Mission based
          </h2>
          <p>
            In mission‑based ethnography, a predefined task guides the
            observation. This might involve studying:
          </p>
          <ul>
            <li>a subculture,</li>
            <li>a specific group,</li>
            <li>an ongoing interaction,</li>
            <li>or a user across multiple platforms.</li>
          </ul>
          <p>
            The “mission” determines the focus—such as patterns of behavior
            (“who does what, when”) or cultural elements (“what words or symbols
            appear in which contexts”). The context is defined by what is
            observable during the observation period and by the mission itself.
          </p>
          <p>
            Analytically, this approach aligns with
            <strong>meso‑level sociological analysis</strong> or
            <strong>media discourse analysis</strong>. Outputs typically include
            observation notes, coding schemes, and longer immersion‑based
            descriptive texts.
          </p>
          <template #bottom>
            <div class="flex justify-center">
              <UButton
                size="xl"
                @click="() => selectTemplate('mission-based')"
                variant="outline"
                class="bg-green-950/50 hover:bg-green-950"
              >
                Select template
              </UButton>
            </div>
          </template>
        </SubCard>
        <SubCard class="w-full">
          <h2>
            <UIcon name="heroicons:calendar-date-range" />
            Exploratory
          </h2>
          <p>
            Exploratory ethnography follows the field rather than a predefined
            mission. Instead of focusing on specific events or tasks, the
            researcher is guided by what unfolds over longer periods. This is a
            <strong>fieldwork‑driven approach</strong>, where emerging events,
            practices, and contexts shape the direction of the study.
          </p>
          <p>Exploratory digital ethnography may serve as:</p>
          <ul>
            <li>the primary data collection strategy, or</li>
            <li>
              a preliminary phase for identifying relevant data sites and
              defining later mission‑based focus areas.
            </li>
          </ul>
          <p>
            Outputs emphasize extended observation notes, where specific events
            (e.g., screenshots) play a less central role in structuring the
            narrative.
          </p>
          <template #bottom>
            <div class="flex justify-center">
              <UButton
                size="xl"
                variant="outline"
                class="bg-green-950/50 hover:bg-green-950"
                @click="() => selectTemplate('exploratory')"
              >
                Select template
              </UButton>
            </div>
          </template>
        </SubCard>
      </div>
    </div>
    <div class="mt-6 flex gap-x-3 justify-end">
      <UButton
        variant="outline"
        color="blue"
        @click="() => emit('close', true)"
      >
        Skip
      </UButton>
      <UButton
        variant="outline"
        color="gray"
        @click="() => emit('close', false)"
      >
        Cancel
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: [boolean];
  "select:parameters": [NewProjectField[]];
}>();

type TemplateName = "exploratory" | "mission-based" | "event-based";

const template: Record<TemplateName, NewProjectField[]> = {
  "event-based": [
    {
      label: "SoMe username",
      type: "STRING",
      required: true,
      index: 1,
    },
    {
      label: "Platform",
      type: "AUTOCOMPLETE",
      required: true,
      index: 2,
      choices: ["X", "Reddit", "Meta"],
    },
    {
      label: "Profile picture",
      type: "IMAGE_SINGLE",
      required: false,
      index: 3,
    },
  ],
  "mission-based": [
    {
      label: "SoMe username",
      type: "STRING",
      required: true,
      index: 1,
    },
    {
      label: "Number of posts",
      type: "INT",
      required: false,
      index: 2,
    },
    {
      label: "Platform (example)",
      type: "MULTIPLE_CHOICE_ADD",
      required: true,
      index: 3,
      choices: ["X", "Reddit", "Meta"],
    },
    {
      label: "Observation specification",
      type: "STRING",
      required: true,
      index: 4,
    },
    {
      label: "Screenshots",
      type: "IMAGE_MULTIPLE",
      required: false,
      index: 5,
    },
  ],
  exploratory: [
    {
      label: "Notes",
      type: "STRING",
      required: true,
      index: 1,
    },
    {
      label: "Date and time",
      type: "DATETIME",
      required: false,
      index: 2,
    },
    {
      label: "Images",
      type: "IMAGE_MULTIPLE",
      required: false,
      index: 3,
    },
  ],
};

function selectTemplate(name: TemplateName) {
  emit("select:parameters", template[name]);
  emit("close", true);
}
</script>
