/// <reference types="types-for-adobe/aftereffects/2018"/>

function getComp(compName: string) {
  let comp: CompItem | undefined;
  for (let i = 1; i <= app.project.numItems; i++) {
    if (
      app.project.item(i) instanceof CompItem &&
      app.project.item(i).name === compName
    ) {
      comp = app.project.item(i) as CompItem;
      break;
    }
  }
  if (!comp) throw new Error(`Failed to find comp named ${compName}`);
  return comp;
}

function getAVItem(itemName: string) {
  let item: AVItem | undefined;
  for (let i = 1; i <= app.project.numItems; i++) {
    if (
      app.project.item(i) instanceof AVItem &&
      app.project.item(i).name === itemName
    ) {
      item = app.project.item(i) as AVItem;
      break;
    }
  }
  if (!item) throw new Error(`Failed to find comp named ${itemName}`);
  return item;
}

function importFootage(filePath: string) {
  const file = new File(filePath);

  if (!file.exists) throw new Error(`File not found: ${filePath}`);

  const importOptions = new ImportOptions(file);
  //importOptions.importAs = ImportAsType.COMP; // you can do stuff like this at this point for PSDs
  return app.project.importFile(importOptions) as AVItem;
}

function addLayer(
  item: AVItem,
  comp: CompItem,
  { name }: { name?: string } = {}
) {
  const layer = comp.layers.add(item);
  layer.name = name ?? layer.name;
  return layer;
}

function duplicateLayer(
  layer: string | number,
  comp: CompItem,
  newName: string
) {
  const target =
    typeof layer === "string" ? comp.layer(layer) : comp.layer(layer);
  const dupe = target.duplicate();
  dupe.name = newName;
  return dupe;
}

function copyLayerToComp(
  layer:
    | Layer
    | { name: string; comp: CompItem }
    | { index: number; comp: CompItem },
  copy: { name?: string; comp: CompItem }
) {
  const targetLayer =
    layer instanceof Layer
      ? layer
      : (("name" in layer
          ? layer.comp.layer(layer.name)
          : layer.comp.layer(layer.index)) as Layer);
  targetLayer.copyToComp(copy.comp);
  const newLayer = copy.comp.layer(1); // potential bug if layer already selected
  if (copy.name) newLayer.name = copy.name;
  return newLayer;
}

function updateTextLayer(
  layer:
    | TextLayer
    | { name: string; comp: CompItem }
    | { index: number; comp: CompItem },
  text: string
) {
  const textLayer =
    layer instanceof TextLayer
      ? layer
      : (("name" in layer
          ? layer.comp.layer(layer.name)
          : layer.comp.layer(layer.index)) as TextLayer);
  return textLayer.text.sourceText.setValue(new TextDocument(text));
}

function updateTextLayerAtTime(
  layer:
    | TextLayer
    | { name: string; comp: CompItem }
    | { index: number; comp: CompItem },
  text: string,
  time: number
) {
  const textLayer =
    layer instanceof TextLayer
      ? layer
      : (("name" in layer
          ? layer.comp.layer(layer.name)
          : layer.comp.layer(layer.index)) as TextLayer);
  return textLayer.text.sourceText.setValueAtTime(time, new TextDocument(text));
}

function updateTextLayerAtTimes(
  layer:
    | TextLayer
    | { name: string; comp: CompItem }
    | { index: number; comp: CompItem },
  texts: string[],
  times: number[]
) {
  const textLayer =
    layer instanceof TextLayer
      ? layer
      : (("name" in layer
          ? layer.comp.layer(layer.name)
          : layer.comp.layer(layer.index)) as TextLayer);

  const textDocuments: TextDocument[] = [];
  for (let text of texts) {
    textDocuments.push(new TextDocument(text));
  }
  return textLayer.text.sourceText.setValuesAtTimes(times, textDocuments);
}

function updateLayerAtTimes(
  layer:
    | Layer
    | { name: string; comp: CompItem }
    | { index: number; comp: CompItem },
  property: string,
  times: number[],
  values: number[],
  { interpolationType }: { interpolationType?: KeyframeInterpolationType } = {}
) {
  const myLayer =
    layer instanceof Layer
      ? layer
      : (("name" in layer
          ? layer.comp.layer(layer.name)
          : layer.comp.layer(layer.index)) as Layer);

  const prop = myLayer.property(property) as Property;

  prop.setValuesAtTimes(times, values);

  if (interpolationType) {
    for (let time of times) {
      prop.setInterpolationTypeAtKey(
        prop.nearestKeyIndex(time),
        interpolationType
      );
    }
  }
}

function getFootageItem(itemName: string) {
  let item: FootageItem | undefined;
  for (let i = 1; i <= app.project.numItems; i++) {
    if (
      app.project.item(i) instanceof FootageItem &&
      app.project.item(i).name === itemName
    ) {
      item = app.project.item(i) as FootageItem;
      break;
    }
  }
  if (!item) throw new Error(`Failed to find item named ${itemName}`);
  return item;
}

function get3Digits(num: number) {
  if (num < 999) return `${num}`;
  else if (num < 99999) return `${Math.round(num / 100) / 10}k`;
  else return `${Math.round(num / 1000)}k`;
}

function setColorControls(comp: CompItem) {
  const colorControlsLayer = comp.layer("color-controls");

  setColorControl(colorControlsLayer, "text-color", [22, 22, 23]);
  setColorControl(colorControlsLayer, "text-color-alt", [135, 138, 140]);
  setColorControl(colorControlsLayer, "text-color-alt-2", [135, 138, 140]);
  setColorControl(colorControlsLayer, "stroke-color", [204, 204, 204]);
  setColorControl(colorControlsLayer, "bar-color", [237, 239, 241]);
  setColorControl(colorControlsLayer, "main", [255, 255, 255]);
  setColorControl(colorControlsLayer, "accent", [252, 252, 252]);
  setColorControl(colorControlsLayer, "bg", [238, 238, 238]);
}

function setColorControl(
  layer: Layer,
  control: string,
  value: [number, number, number]
) {
  var adjustedValues = [value[0] / 255, value[1] / 255, value[2] / 255];
  var effects = layer.property("Effects");
  var colorControl = effects.property(control);
  var color = colorControl.property("Color");
  (color as any).setValue(adjustedValues);
}

/**
 * Adds a transition clip at outPoint of last voice-over audio clip.
 * @param comp the target composition to add a transition to
 * @param refLayer the layer to use as a reference for the outPoint
 * @param options
 */
function addTransition(
  comp: CompItem,
  refLayer: Layer,
  { footageName = "transition-1s_1080-1920.mp4" }: { footageName?: string } = {}
): Layer {
  const transitionLayer = addLayer(getFootageItem(footageName), comp, {
    name: "transition",
  });
  transitionLayer.startTime = refLayer.outPoint;

  return transitionLayer;
}

// function addGold(
//   comp: CompItem,
//   referenceLayer: Layer,
//   amounts: [number, number, number]
// ) {
//   let refLayer = referenceLayer;
//   const types = ["silver", "gold", "platinum"];
//   for (let i = types.length - 1; i >= 0; i--) {
//     const type = types[i];
//     if (amounts[i] > 0) {
//       const item = getAVItem(`${type}_512.png`);
//       const itemLayer = comp.layers.add(item);
//       itemLayer.scale.setValue([0.078125, 0.078125]); // 40px / 512px
//       if (amounts[i] > 1) {
//         const textDoc = new TextDocument(`${amounts[i]}`);
//         textDoc.
//         const textLayer = comp.layers.addText("");
//       }

//       xOffset;
//     }
//   }
// }
