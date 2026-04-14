<template>
  <div
    class="[&_h2]:flex [&_h2]:items-center [&_h2_span]:text-4xl [&_h2]:gap-2 [&_h2_span]:text-green-500 [&_strong]:font-semibold [&_h2]:text-xl [&_p]:text-sm [&_li]:text-sm [&_h2]:mb-4 [&_p]:mb-3 [&_ul]:mb-3 [&_li]:list-disc [&_ul]:pl-3"
  >
    <div class="lg:pt-[200px] xl:pt-0">
      <div v-if="!isEventSubStep" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                @click="() => (isEventSubStep = true)"
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

      <div v-if="isEventSubStep" class="[&_h2]:text-xl text-center">
        <div class="mb-9">
          <h1 class="text-3xl mb-3">Event based</h1>

          <div class="mb-3 max-w-[800px] mx-auto w-full">
            <div>
              Event based observations focuses on a specific observed behaviour
              in a concrete observation context.
            </div>
          </div>
          <div class="max-w-[800px] mx-auto w-full">
            <div>
              You can do a simple event based ethnography across multiple
              platforms or you can do an experiment setup, where you observe
              events from multiple subjects.
            </div>
          </div>
        </div>

        <div
          class="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-12 max-w-[900px] w-full mx-auto"
        >
          <SubCard class="w-full">
            <h2 class="justify-center">Simple</h2>
            <p>
              Simple Event Based ethnography seeks to collect observations
              depending on the presence of specific behaviour in one or across
              multiple platforms.
            </p>
            <p>
              You will as a minimum have to code which behaviour you observe. We
              suggest parameter type ‘ multiple choice or free text’ as multiple
              behaviours can be present in one event and an open coding might be
              necessary for novel interest in behaviour types.
            </p>
            <p>
              If you observe on multiple platforms, you will need to code that
              as well.
            </p>
            <template #bottom>
              <div class="flex justify-center">
                <UButton
                  size="xl"
                  variant="outline"
                  class="bg-green-950/50 hover:bg-green-950"
                  @click="() => selectTemplate('event-based-simple')"
                >
                  Select
                </UButton>
              </div>
            </template>
          </SubCard>
          <SubCard class="w-full">
            <h2 class="justify-center">Experiment</h2>
            <p>
              Experiment type observations are subject specific ethnographies,
              where events are observed chronologically for specific subjects.
            </p>
            <p>
              Observations are done for multiple subjects or profiles to create
              a trajectory for each subject.
            </p>
            <p>
              To build this trajectory we must create a behavioural scheme for
              each subject, and record what actions it takes, and what
              observations follow what actions.
            </p>
            <p>
              We are not only interested in the observed event, but which
              subject observed the event and during what subject action. The
              project blueprint provided is observing criminal trajectories on
              Snapchat.
            </p>
            <template #bottom>
              <div class="flex justify-center">
                <UButton
                  size="xl"
                  variant="outline"
                  class="bg-green-950/50 hover:bg-green-950"
                  @click="() => selectTemplate('event-based-experiment')"
                >
                  Select
                </UButton>
              </div>
            </template>
          </SubCard>
        </div>
      </div>
    </div>

    <div class="flex gap-x-3 justify-center mt-12 mb-9">
      <UButton
        variant="outline"
        color="blue"
        @click="() => (isEventSubStep = false)"
        v-if="isEventSubStep"
      >
        Go back
      </UButton>
      <UButton
        variant="outline"
        color="blue"
        @click="() => emit('close', true)"
        v-if="!isEventSubStep"
      >
        Skip
      </UButton>
      <UButton
        v-if="cancelable"
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

const props = defineProps({
  cancelable: {
    type: Boolean,
    required: false,
    default: () => false,
  },
});

type TemplateName =
  | "exploratory"
  | "mission-based"
  | "event-based-simple"
  | "event-based-experiment";

const isEventSubStep = ref(false);

const template: Record<TemplateName, NewProjectField[]> = {
  "event-based-experiment": [
    {
      type: "CHOICE",
      label: "Profile #",
      choices: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      index: 1,
      required: true,
    },
    {
      label: "Action",
      type: "CHOICE",
      required: true,
      index: 3,
      choices: [
        "Recording current network(Add backs)",
        "Recommendations(Quick Add Scroll)",
        "Adding seller",
        "Removing seller",
      ],
    },
    {
      label: "Drug sales",
      type: "MULTIPLE_CHOICE_ADD",
      choices: [
        "Drug sales",
        "Sex work/content ",
        "Digital sexwork (sexting, nudes, vids)",
        "Traditional Sexwork (meet up)",
        "Soliciting sexwork (sugar daddying)",
        "Sugar dating (sugar baby)",
        "Sexual Hookup profile",
        "Deviant behaviour and miscellaneous",
        "Nicotine sales (vapes, Snuff, e-liquid)",
        "Stolen goods",
        "Weapons",
        "Peptides (Ozempic, Wegovy)",
        "Steroids (tren, roids)",
      ],
      required: true,
      index: 3,
    },
    {
      label: "Observation comments / researcher reflections",
      type: "TEXTAREA",
      required: false,
      index: 4,
    },
  ],
  "event-based-simple": [
    {
      label: "Platform",
      type: "CHOICE",
      choices: [
        "Facebook",
        "Instagram",
        "Snapchat",
        "Tiktok",
        "Discord",
        "Reddit",
        "X",
      ],
      required: true,
      index: 1,
    },
    {
      label: "Behaviour",
      type: "MULTIPLE_CHOICE_ADD",
      choices: [
        "Drug sales",
        "Nicotine sales",
        "Stoken goods",
        "Bullying",
        "Thread(s)",
        "Recruitment",
        "Scam",
        "Self harm",
        "Image based sexual abuse",
        "Child sexual abuse material",
      ],
      required: true,
      index: 2,
    },
    {
      label: "Actor",
      type: "STRING",
      required: false,
      index: 3,
    },
    {
      label: "Observation comments / researcher reflections",
      type: "TEXTAREA",
      required: false,
      index: 4,
    },
  ],
  "mission-based": [
    {
      label: "When was the content published?",
      type: "DATETIME",
      required: true,
      index: 1,
    },
    {
      label: "Describe how the situation fits into this thread/forum",
      type: "TEXTAREA",
      required: true,
      index: 2,
    },
    {
      label:
        "How does this person's post appear compared to how this person has otherwise posted?",
      type: "CHOICE",
      required: true,
      index: 3,
      choices: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    },
    {
      label: "Examples of whom it is hateful towards",
      type: "TEXTAREA",
      required: false,
      index: 4,
    },
  ],
  exploratory: [
    {
      label: "Date and time",
      type: "DATETIME",
      required: false,
      index: 1,
    },
    {
      label: "Title",
      type: "STRING",
      required: true,
      index: 2,
    },
    {
      label: "Description",
      type: "TEXTAREA",
      required: false,
      index: 3,
    },
    {
      label: "Images",
      type: "IMAGE_MULTIPLE",
      required: false,
      index: 4,
    },
  ],
};

function selectTemplate(name: TemplateName) {
  emit("select:parameters", template[name]);
  emit("close", true);
}
</script>
