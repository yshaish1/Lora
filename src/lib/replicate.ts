import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function startTraining(
  zipUrl: string,
  triggerWord: string
) {
  const owner = process.env.REPLICATE_USERNAME || "user";
  const modelName = "flux-lora-custom";
  const destination = `${owner}/${modelName}` as `${string}/${string}`;

  // Ensure the destination model exists (create if not)
  try {
    await replicate.models.get(owner, modelName);
  } catch {
    await replicate.models.create(owner, modelName, {
      visibility: "private",
      hardware: "gpu-t4",
      description: "Custom Flux LoRA model",
    });
  }

  // Fetch the latest trainer version
  const trainerModel = await replicate.models.get("ostris", "flux-dev-lora-trainer");
  const latestVersion = trainerModel.latest_version?.id;

  if (!latestVersion) {
    throw new Error("Could not find latest version of flux-dev-lora-trainer");
  }

  const training = await replicate.trainings.create(
    "ostris",
    "flux-dev-lora-trainer",
    latestVersion,
    {
      destination,
      input: {
        input_images: zipUrl,
        trigger_word: triggerWord,
        steps: 1000,
        autocaption: true,
        learning_rate: 0.0004,
      },
    }
  );
  return training;
}

export async function getTrainingStatus(trainingId: string) {
  return replicate.trainings.get(trainingId);
}

export async function startGeneration(
  loraWeightsUrl: string,
  prompt: string
) {
  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-dev",
    input: {
      prompt,
      hf_lora: loraWeightsUrl,
      lora_scale: 0.8,
      num_outputs: 1,
      guidance: 3.5,
      num_inference_steps: 28,
      output_format: "webp",
    },
  });
  return prediction;
}

export async function getPredictionStatus(predictionId: string) {
  return replicate.predictions.get(predictionId);
}
