import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const FLUX_LORA_TRAINER = "ostris/flux-dev-lora-trainer";
const FLUX_LORA_TRAINER_VERSION =
  "d995297071a44dcb72244e6c19462f9670cb8cd5e1b4e9314d9b22ccc0f1b5b9";

export async function startTraining(
  zipUrl: string,
  triggerWord: string
) {
  const training = await replicate.trainings.create(
    "ostris",
    "flux-dev-lora-trainer",
    FLUX_LORA_TRAINER_VERSION,
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
