const docTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.oasis.opendocument.text',
]

const spreadsheetTypes = [
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
]

const powerpointTypes = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.ms-powerpoint',
]

const pdfTypes = [
  'application/pdf',
]

const imageTypes = [
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webm',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
]

const videoTypes = [
  'video/x-flv',
  'video/mp4',
  'application/x-mpegURL',
  'video/MP2T',
  'video/3gpp',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/webm'
];

const audioTypes = [
  'audio/basic',
  'auido/L24',
  'audio/mid',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-aiff',
  'audio/x-mpegurl',
  'audio/vnd.rn-realaudio',
  'audio/vnd.rn-realaudio',
  'audio/ogg',
  'audio/vorbis',
  'audio/vnd.wav',
  'audio/webm',
]

const docIcon = { class: 'text-blue-400', icon: 'i-mdi-file-document-outline'};
const spreadsheetIcon = { class: 'text-green-400', icon: 'i-mdi-spreadsheet'};
const powerpointIcon = { class: 'text-red-700', icon: 'i-mdi-file-powerpoint-box-outline'};
const imageIcon = { class: 'white', icon: 'i-mdi-image-outline'};
const pdfIcon = { class: 'text-red-700', icon: 'i-mdi-file-pdf-outline'};
const fileIcon = { class: 'white', icon: 'i-mdi-file-outline'};
const videoIcon = { class: 'text-purple-400', icon: 'i-mdi-video-outline'};
const audioIcon = { class: 'text-yellow-600', icon: 'i-mdi-music'};


export const fileIconMap = {
  default: fileIcon,
  icons: [
    iconConfig(spreadsheetTypes, spreadsheetIcon),
    iconConfig(docTypes, docIcon),
    iconConfig(powerpointTypes, powerpointIcon),
    iconConfig(imageTypes, imageIcon),
    iconConfig(pdfTypes, pdfIcon),
    iconConfig(spreadsheetTypes, spreadsheetIcon),
    iconConfig(videoTypes, videoIcon),
    iconConfig(audioTypes, audioIcon),
  ]
}

function iconConfig(
  mimetypes: string[],
  icon: {
    class: string;
    icon: string;
  }
) {
  return {
    mimetypes,
    icon,
  }
}

export function getIconByMimetype(
  mimetype: string
): { icon: string, class: string } {
  for(let { icon, mimetypes } of fileIconMap.icons) {
    if (mimetypes.includes(mimetype)) {
      return icon;
    }
  }

  return fileIconMap.default;
}