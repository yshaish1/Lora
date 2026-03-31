import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function startTraining(
  zipUrl: string,
  triggerWord: string
) {
  // Fetch the latest version dynamically
  const model = await replicate.models.get("ostris", "flux-dev-lora-trainer");
  const latestVersion = model.latest_version?.id;

  if (!latestVersion) {
    throw new Error("Could not find latest version of flux-dev-lora-trainer");
  }

  const training = await replicate.trainings.create(
    "ostris",
    "flux-dev-lora-trainer",
    latestVersion,
    {
      destination: `${process.env.REPLICATE_USERNAME || "user"}/flux-lora-custom` as `${string}/${string}`,
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
