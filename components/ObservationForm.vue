
<template>
  <UCard>
    <div class="mb-4 font-bold">Observation metadata</div>
    <div>
      <UForm ref="form" :validate="validate" :state="state" @submit.prevent="submit">
        <div v-for="({ props, element, field }) in inputs" class="mb-4">
          <UFormGroup :name="field.label" :label="field.label">
          <!-- <UFormGroup :name="field.label" :label="formLabel" :label="`Enter ${field.label}:`"> -->
            <component :is="element" v-model="state[field.label]" v-bind="props" />
          </UFormGroup>
        </div>
        <UButton class="mt-4" type="submit">Save observation draft</UButton>
      </UForm>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
  import type { FormError } from '@nuxthq/ui/dist/runtime/types/form';
  import { FieldType, type ObservationDraft } from '@prisma/client';
  import type UInput from '@nuxthq/ui/dist/runtime/components/forms/Input.vue';

  const form = ref();
  const state = ref({} as any);
  const inputs = ref([] as CMSInput[]);
  const toast = useToast();
  const { updateDraftMetadata } = await useProjects();
  const props = defineProps({
    project: Object as PropType<FullProject>,
    draft: Object as PropType<ObservationDraft>,
  });

  const inputTypes: Record<FieldType, string> = Object.freeze({
    [FieldType.DATE]: 'datetime-local',
    [FieldType.STRING]: 'text',
    [FieldType.INT]: 'number',
    [FieldType.FLOAT]: 'number',
  });


  function validate(state: any): FormError[] {
    if (!props.project) {
      throw createError({
        statusMessage: 'Project does not exist',
        statusCode: 400,
      });
    }
    if (!props.draft) {
      throw createError({
        statusMessage: 'Project does not exist',
        statusCode: 400,
      });
    }

    const errors = [] as FormError[];

    // scan for missing fields
    // TODO: check if field is required or optional
    const missingFields = props.project.fields.filter(f => !Object.keys(state).includes(f.label))
    if (missingFields.length > 0) {
      for(const field of missingFields) {
        errors.push({ path: field.label, message: 'Field is required'});
      }
    }
  
    // validate each state value
    for (const [key, value] of Object.entries(state)) {
      // validate field (field)
      const field = props.project.fields.find((field) => field.label == key)
      if (!field) {
        throw createError({
          statusCode: 500,
          statusMessage: `Field '${key}' does not exist :(`
        });
      }

      // TODO: check if field is required or optional
      if (value === null || value === undefined) {
        errors.push({ path: key, message: 'Required'})
      }

      // validate numbers
      if (
        field.type == FieldType.FLOAT ||
        field.type == FieldType.INT
      ) {
        const valueFloat = parseFloat(''+value);
        if (isNaN(valueFloat)) {
          errors.push({ path: key, message: 'Invalid number'})
        }
      }

      // validate strings
      // TODO: check if field is required or optional
      if (
        field.type == FieldType.STRING
      ) {
        if ((''+value).length === 0) {
          errors.push({ path: key, message: 'Text field is required'})
        }
      }

      // validate dates
      // NOTE: only acceps dates in ISO string
      // TODO: check if field is required or optional
      if (
        field.type == FieldType.DATE
      ) {
        const valueDate = new Date(''+value);
        if (isNaN(valueDate.getTime())) {
          errors.push({ path: key, message: 'Date field is invalid'})
        }
      }
    }

    return errors;
  }

  if (!props.draft || !props.project) {
    toast.add({
      title: props.draft ? 'Observation draft does not exist' : 'Project does not exist',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    });
    navigateTo('/');
  } else {
    if (inputs.value.length == 0) {
      buildForm(props.project);
    }
  }

  function buildForm(project: FullProject) {
    for (const field of project.fields) {
      const inputArgs: CMSInputProps = {
        placeholder: 'Enter ' + field.label,
        name: field.label,
        type: inputTypes[FieldType.STRING],
      };

      if (field.type == FieldType.FLOAT) {
        inputArgs.type = inputTypes[FieldType.FLOAT]
        inputArgs.step = 0.1;
      } else if (field.type == FieldType.INT) {
        inputArgs.type = inputTypes[FieldType.INT]
      } else if (field.type == FieldType.DATE) {
        inputArgs.type = inputTypes[FieldType.DATE]
      } else if (field.type != FieldType.STRING) {
        throw new Error(`Field with type '${field.type}' is not support :( Try again in an hour`);
      }

      const element = markRaw(resolveComponent('UInput') as typeof UInput);
      inputs.value.push({
        field,
        props: inputArgs,
        element,
      });
    }
  }

  async function submit() {
    try {
      await form.value!.validate();
    } catch(e) {
      // Do nothing as library takes care of errors
      // NOTE: this is to avoid uncaught rejected promises
      return;
    }

    if (props.project?.id && props.draft?.id) {
      // const res = await createObservation(props.project?.id, state.value);
      const res = await updateDraftMetadata(
        props.project.id,
        props.draft?.id,
        state.value
      );
      if (!runsInElectron()) {
        toast.add({
          title: 'Observation metadata was added to draft.'
        });
      }
      navigateTo(`/projects/${props.project.id}/observation_drafts/${props.draft.id}/uploadImage`);
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Project or observation does not exist',
      })
    }
  }
</script>