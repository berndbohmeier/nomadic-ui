const SAMPLE_NAME_LABEL_OFFSET = 46;
const SAMPLE_NAME_LABEL_PADDING = 12;

export function getSampleNameAxisHeight(
  sampleNames: string[],
  measureText: (text: string) => number,
) {
  const longestLabel = Math.max(0, ...sampleNames.map(measureText));
  return Math.ceil(
    SAMPLE_NAME_LABEL_OFFSET + longestLabel + SAMPLE_NAME_LABEL_PADDING,
  );
}

export function measureSampleNameAxisHeight(sampleNames: string[]) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to measure sample names for chart labels");
  }

  const fontFamily = getComputedStyle(document.body).fontFamily;
  context.font = `500 12px ${fontFamily}`;
  return getSampleNameAxisHeight(
    sampleNames,
    (sampleName) => context.measureText(sampleName).width,
  );
}
