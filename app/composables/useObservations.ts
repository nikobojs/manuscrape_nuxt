import type { RouteParams } from "vue-router";
import { getErrMsg } from "#imports";
import { captureException } from "@sentry/vue";

export const useObservations = async (
  projectId: number,
  defaultObservationFilter?: keyof typeof ObservationFilter,
  immediate = true,
) => {
  const observations = useState<FullObservation[]>("observations", () => []);
  const page = useState<number>(() => 1);
  const orderBy = useState<string>(() => "createdAt");
  const orderByDirection = useState<"asc" | "desc">(
    () => "desc" as "asc" | "desc",
  );
  const pageSize = 6;
  const skip = computed(() => (page.value - 1) * pageSize);
  const filter = useState<"all" | "drafts" | "published">(() =>
    defaultObservationFilter
      ? ObservationFilter[defaultObservationFilter]!.filter
      : ("all" as "all" | "drafts" | "published"),
  );
  const ownership = useState<"me" | "everyone">(() =>
    defaultObservationFilter
      ? ObservationFilter[defaultObservationFilter]!.ownership
      : ("everyone" as "everyone" | "me"),
  );
  const totalObservations = useState<number>("totalObservations", () => 1); // should change after first fetch
  const totalDraftObservations = useState<number>(
    "totalDraftObservations",
    () => 0,
  ); // should change after first fetch
  const totalPages = computed(() =>
    Math.ceil(totalObservations.value / pageSize),
  );

  // const filterOption = useState<ObservationFilterConfig>(() => {
  const filterOption = ref<ObservationFilterConfig>(
    ObservationFilter[defaultObservationFilter || ObservationFilterTypes.ALL]!,
  );
  watch(filterOption, (obsFilter) => {
    if (obsFilter) {
      filter.value = obsFilter.filter;
      ownership.value = obsFilter.ownership;
      page.value = 1;
    }
  });

  const nextObsUrl = computed(() =>
    `
    /api/projects/${projectId}/observations?
      take=${pageSize}&
      skip=${skip.value}&
      orderBy=${orderBy.value}&
      orderDirection=${orderByDirection.value}&
      filter=${filter.value}&
      ownership=${ownership.value}
  `
      .trim()
      .replaceAll(/\s/g, ""),
  );

  const obsUrl = useState(() => nextObsUrl.value);

  function queryParamsUpdate() {
    obsUrl.value = nextObsUrl.value;
  }

  watch(page, () => {
    queryParamsUpdate();
  });

  const { pending: loading, refresh: refreshObservations } =
    await useFetch<GetObservationsResponse>(() => obsUrl.value, {
      method: "GET",
      immediate: immediate,
      server: immediate,
      credentials: "include",

      onRequest: () => {
        console.log("requesting observations", {
          ownership: ownership.value,
          orderBy: orderBy.value,
          orderByDirection: orderByDirection.value,
          page: page.value,
        });
      },

      onResponse: async (context) => {
        if (context.response.status === 200) {
          observations.value =
            context.response._data?.observations.reverse?.() || [];
          totalObservations.value = context.response._data?.total || 0;
          totalDraftObservations.value =
            context.response._data?.totalDraft || 0;
        } else if (context.response.status === 401) {
          observations.value = [];
          await navigateTo("/login", { replace: true });
        }
      },
      onResponseError: async (context) => {
        console.error(context.error);
        captureException(context.error, {
          data: { _data: context.response?._data },
        });
        if (context.response.status === 401) {
          observations.value = [];
          await navigateTo("/login", { replace: true });
        }
      },
    });

  const requireObservationFromParams = async (
    params: RouteParams,
  ): Promise<FullObservation> => {
    const _observationId = requireNumber(
      params?.observationId,
      "observationId",
    );
    const _projectId = requireNumber(params?.projectId, "projectId");

    const obs = await fetchObservationById(_projectId, _observationId);

    if (!obs) {
      throw new Error("Observation does not exist");
    }

    return obs;
  };

  return {
    filter,
    filterOption,
    loading,
    observations,
    orderBy,
    orderByDirection,
    queryParamsUpdate,
    ownership,
    page,
    pageSize,
    refreshObservations,
    requireObservationFromParams,
    totalDraftObservations,
    totalObservations,
    totalPages,
  };
};
