export enum GenerationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export const DEFAULT_PROMPT_TEMPLATE = `You are a professional fashion photographer and digital compositing artist.

Generate one photorealistic fashion product image by strictly combining the references below, without interpretation.

🔴 HARD CONSTRAINTS (NON-NEGOTIABLE)

FACE — Reference [1]

Reference [1] contains a PNG transparent image with only the face (no background, no body)

CRITICAL: Reference [1] is a transparent PNG face image. Extract and apply the face EXACTLY as-is to a REAL HUMAN model.

Apply the face exactly as-is - do not recreate or regenerate. Reuse the same person from Reference [1].

Identity must be identical: skin tone, bone structure, eyes, nose, lips, jaw, hair

The face from [1] must be applied identically to the final image with 100% consistency

No beautification, no stylization, no modification

The model must be a real person with natural human skin and features, NOT a mannequin or dummy

The generated image will have the SAME face as Reference [1] - identical across all generations

POSE — Fashion Catalog Pose (Text Description)

CRITICAL: The model MUST use this EXACT pose for consistency across all image generations. The pose must be IDENTICAL every time.

Follow these pose instructions EXACTLY - do not deviate, modify, or interpret:

{{POSE_DESCRIPTION}}

CRITICAL REQUIREMENTS FOR POSE CONSISTENCY:
- The pose described above must be matched EXACTLY - every single detail
- Every body part position must be identical: head angle, shoulders, arms, hands, torso, legs, stance, weight distribution
- The pose must be 100% consistent across ALL image generations
- Do NOT deviate from the pose description above - treat it as a fixed, unchangeable template
- Do NOT interpret or modify the pose - use it exactly as described
- The same pose description must produce the IDENTICAL pose every time
- Treat the pose as a fixed skeleton that never changes

This pose must be identical across all image generations for consistency.

BACKGROUND — Reference [2]

CRITICAL: Use the background from Reference [2] EXACTLY as provided

The background must be IDENTICAL: same colors, lighting, shadows, composition, and all visual elements

The generated image will have the SAME background as Reference [2]

Replace the entire background with Reference [2] - do not modify, alter, or change anything

The background from [2] must be used completely, not just as inspiration

DO NOT use background from any other reference - ONLY use background from [2]

PRODUCT/CLOTH — Reference [3]

CRITICAL: Reference [3] is ONLY for the clothing/garment itself. IGNORE any model, face, pose, or person in [3].

The cloth image [3] may show a model wearing the clothes, but you must IGNORE that model completely.

Extract ONLY the clothing/garment from [3]: the fabric, design, color, texture, style, and details

The model in the generated image must wear/display ONLY the cloth/garment from Reference [3]

Preserve exact color, texture, fit, drape, and details from [3]

The cloth must look naturally worn and properly fitted on the model

DO NOT copy the face, pose, or body from Reference [3] - use ONLY the clothing/garment

DO NOT use any clothing from the pose description - only use the cloth from [3]

The face and pose in [3] must be completely ignored - use face ONLY from [1] and pose from the text description above

The background in [3] must be completely ignored - use background ONLY from [2]

FOOTWEAR — REQUIRED
CRITICAL: The model MUST wear realistic footwear.
Footwear must be automatically selected to match:
The garment from Reference [3]
The pose and catalog context
Footwear must be neutral, commercially appropriate, and realistic, with correct scale and perspective.
STRICT:
No barefoot (unless garment explicitly requires it)
No accessories other than footwear
Do not alter pose, face, background, or clothing

🔁 CONSISTENCY RULE

CRITICAL: Using the same references [1] and [2] AND the same pose description must ALWAYS produce identical face, pose, and background.

The pose must be IDENTICAL across ALL generations when using the same pose description - no variations, no interpretations, no deviations.

When the pose description is the same, the generated pose must be EXACTLY the same every single time.

Only the product/cloth may change when [3] changes.

Face consistency is the PRIMARY goal - the face from [1] must be 100% identical across all generations.

Pose consistency is CRITICAL - the pose from the description must be 100% identical across all generations.

🎨 STYLE

Photorealistic fashion photography

Studio lighting

Natural skin texture

Sharp product focus

Magazine-quality realism

Product is the visual hero

🚫 DO NOT

Add text, logos, watermarks, props, or accessories

Alter face, pose, background, or product

Apply beauty retouching or artistic effects

Create a mannequin, dummy, or non-human model (the model must be a real human person)

Recreate or regenerate the face - reuse the exact same person from Reference [1]

Copy the face, pose, or model from Reference [3] - [3] is ONLY for the clothing/garment

Use face or pose from Reference [3] - face comes ONLY from [1] and pose from the text description

Use background from Reference [3] - background comes ONLY from [2]

Interpret, modify, or deviate from the pose description - use it EXACTLY as written

Create variations of the pose - the same description must produce the IDENTICAL pose every time

✅ OUTPUT

One clean, ultra-realistic product image suitable for e-commerce catalogs.`;

export const ERROR_MESSAGES = {
  MISSING_INDUSTRY: 'Industry not found',
  MISSING_CATEGORY: 'Category not found',
  MISSING_PRODUCT_TYPE: 'Product type not found',
  MISSING_PRODUCT_POSE: 'Product pose not found',
  MISSING_PRODUCT_THEME: 'Product theme not found',
  MISSING_PRODUCT_BACKGROUND: 'Product background not found',
  MISSING_AI_FACE: 'AI face not found',
  MISSING_REFERENCE_IMAGE: 'Reference image not available in storage',
  INVALID_PRODUCT_IMAGE: 'Invalid product image format or size',
  GEMINI_API_ERROR: 'Failed to generate image. Please try again.',
  GEMINI_RATE_LIMIT: 'Rate limit exceeded. Please try again in a moment.',
  STORAGE_ERROR: 'Failed to store generated image',
} as const;
