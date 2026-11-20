export enum ObservationFilterTypes {
  ALL = "ALL",
  MINE = "MINE",
  MY_DRAFTS = "MY_DRAFTS",
  MY_PUBLISHED = "MY_PUBLISHED",
  ALL_DRAFTS = "ALL_DRAFTS",
  ALL_PUBLISHED = "ALL_PUBLISHED"
}

export const ObservationFilter: ObservationFilterConfigs = {
  [ObservationFilterTypes.ALL]: {
    value: ObservationFilterTypes.ALL,
    label: 'Show all',
    filter: 'all',
    ownership: 'everyone'
  },
  [ObservationFilterTypes.MINE]: {
    value: ObservationFilterTypes.MINE,
    label: 'Show all uploaded by me',
    filter: 'all',
    ownership: 'me'
  },
  [ObservationFilterTypes.MY_DRAFTS]: {
    value: ObservationFilterTypes.MY_DRAFTS,
    label: 'Show my drafts',
    filter: 'drafts',
    ownership: 'me'
  },
  [ObservationFilterTypes.ALL_DRAFTS]: {
    value: ObservationFilterTypes.ALL_DRAFTS,
    label: 'Show all drafts',
    filter: 'drafts',
    ownership: 'everyone'
  },
  [ObservationFilterTypes.ALL_PUBLISHED]: {
    value: ObservationFilterTypes.ALL_PUBLISHED,
    label: 'Show all published',
    filter: 'published',
    ownership: 'everyone'
  },
  [ObservationFilterTypes.MY_PUBLISHED]: {
    value: ObservationFilterTypes.MY_PUBLISHED,
    label: 'Show my published',
    filter: 'published',
    ownership: 'me'
  },
};

export const observationFilterMenuItems = Object.values(ObservationFilter);