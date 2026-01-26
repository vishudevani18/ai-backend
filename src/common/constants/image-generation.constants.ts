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

/**
 * Default prompt template for Imagen 3.0 Capability model
 * Optimized for Imagen's referential image generation API
 * Uses [1], [2], [3] format (not "Reference [1]") which Imagen API recognizes as direct links
 * Reference [1] = Face/Person (REFERENCE_TYPE_SUBJECT, SUBJECT_TYPE_PERSON)
 * Reference [2] = Background/Setting (REFERENCE_TYPE_CONTROL, CONTROL_TYPE_CANNY)
 * Reference [3] = Product/Clothing (REFERENCE_TYPE_SUBJECT, SUBJECT_TYPE_PRODUCT)
 *
 * Note: enhancePrompt should be set to false in API parameters to prevent prompt rewriting
 */
export const IMAGEN_DEFAULT_PROMPT_TEMPLATE = `Professional fashion photography of a person [1] wearing a product [3] in a specific setting [2].

STRICT CONSTRAINTS:

FACE: Extract the face from [1] exactly. The final model must have an identical identity, skin tone, and bone structure to the person in [1]. Apply the face exactly as-is - do not recreate or regenerate. The face from [1] must be applied identically to the final image with 100% consistency. No beautification, no stylization, no modification. The model must be a real person with natural human skin and features, NOT a mannequin or dummy.

POSE: The model [1] must perform this exact pose: {{POSE_DESCRIPTION}}. Ensure 100% anatomical accuracy to this description. Every body part position must be identical: head angle, shoulders, arms, hands, torso, legs, stance, weight distribution. The pose must be 100% consistent across ALL image generations. Do NOT deviate from the pose description - treat it as a fixed, unchangeable template.

BACKGROUND: Use the environment from [2] as the fixed background. Maintain identical lighting, shadows, and composition from [2]. The background must be IDENTICAL: same colors, lighting, shadows, composition, and all visual elements. Replace the entire background with [2] - do not modify, alter, or change anything. DO NOT use background from any other reference - ONLY use background from [2].

PRODUCT: Display the clothing from [3] on the model [1]. Ignore any person or pose in [3]; capture only the fabric, design, color, texture, style, and details. The model in the generated image must wear/display ONLY the cloth/garment from [3]. Preserve exact color, texture, fit, drape, and details from [3]. The cloth must look naturally worn and properly fitted on the model. DO NOT copy the face, pose, or body from [3] - use ONLY the clothing/garment. The face and pose in [3] must be completely ignored - use face ONLY from [1] and pose from the text description above. The background in [3] must be completely ignored - use background ONLY from [2].

FOOTWEAR: The model MUST wear realistic footwear. Footwear must be automatically selected to match the garment from [3] and the pose. Footwear must be neutral, commercially appropriate, and realistic, with correct scale and perspective. No barefoot (unless garment explicitly requires it). No accessories other than footwear.

CONSISTENCY: Using the same references [1] and [2] AND the same pose description must ALWAYS produce identical face, pose, and background. Face consistency is the PRIMARY goal - the face from [1] must be 100% identical across all generations. Pose consistency is CRITICAL - the pose from the description must be 100% identical across all generations. Only the product/cloth may change when [3] changes.

STYLE & QUALITY: Photorealistic studio catalog shot, 4k resolution, sharp focus on fabric textures, natural skin, commercial lighting. Magazine-quality realism. Product is the visual hero.

DO NOT: Add text, logos, watermarks, props, or accessories. Alter face, pose, background, or product. Apply beauty retouching or artistic effects. Create a mannequin, dummy, or non-human model. Recreate or regenerate the face - reuse the exact same person from [1]. Copy the face, pose, or model from [3] - [3] is ONLY for the clothing/garment. Use face or pose from [3] - face comes ONLY from [1] and pose from the text description. Use background from [3] - background comes ONLY from [2]. Interpret, modify, or deviate from the pose description - use it EXACTLY as written.

OUTPUT: One clean, ultra-realistic product image suitable for e-commerce catalogs.`;

export const KURTI_BOTTOM_WEAR_PROMPT = `
🧵 CONTROLLED GARMENT COMPLETION — KURTI SPECIFIC (NON-NEGOTIABLE)

CRITICAL: This section applies ONLY when Reference [3] contains a TOP-ONLY kurti (single kurti, no bottom wear visible).

GARMENT COMPLETENESS LOGIC:

1. If Reference [3] contains a TOP-ONLY kurti:
   - The system MUST generate a complementary bottom wear.
   - Bottom wear must be:
     - Simple, minimal, and commercially standard
     - Derived ONLY from the kurti's color palette, fabric weight, and style
     - Solid-colored (no prints, no embroidery, no patterns)
     - Neutral in design (straight pant, ankle-length pant, churidar, or palazzo)
   - Bottom wear must NEVER overpower the kurti.
   - Bottom wear must NOT introduce new patterns, colors, or cultural elements.
   - Bottom wear must appear as a natural retail pairing.

2. If Reference [3] already includes bottom wear:
   - Use ONLY the bottom wear from Reference [3].
   - Do NOT modify, replace, or reinterpret it.
   - Do NOT add additional bottom wear.

3. If Reference [3] includes multiple components (2-piece / 3-piece):
   - Use ONLY the components visible in Reference [3].
   - Do NOT synthesize missing components.

BOTTOM WEAR STYLE LOCK (When bottom wear is synthesized):
- Match fabric drape to kurti weight (cotton-to-cotton, rayon-to-rayon)
- Color must be:
  - Same color family as kurti OR
  - Neutral (ivory, beige, off-white, black)
- Fit must be realistic and conservative
- No transparency
- No contrast stitching
- No embellishments
- Generated bottom wear must visually read as secondary to the kurti
- The kurti remains the product hero

CRITICAL:
- Bottom wear synthesis is allowed ONLY for top-only kurti products.
- Never infer or add dupattas, jackets, or accessories.
- Never generate bottom wear if Reference [3] already shows bottom wear.
`;

/**
 * Detects if a product type is a single kurti (top-only)
 * @param productTypeName - The name of the product type
 * @returns true if it's a single kurti, false otherwise
 */
export function isSingleKurtiProduct(productTypeName: string): boolean {
  if (!productTypeName) return false;

  const normalizedName = productTypeName.toLowerCase().trim();

  // Check for single kurti patterns
  const singleKurtiPatterns = [
    'kurti ( top only )',
    'kurti (top only)',
    'kurti top only',
    'single kurti',
    'kurti single',
    'kurti 1 pic',
    'kurti single pic',
  ];

  // Check if it matches single kurti pattern
  const isSingleKurti = singleKurtiPatterns.some(pattern => normalizedName.includes(pattern));

  // Exclude if it's a set (2 pic, 3 pic, etc.)
  const isSet =
    normalizedName.includes('2 pic') ||
    normalizedName.includes('3 pic') ||
    normalizedName.includes('set') ||
    normalizedName.includes('2-piece') ||
    normalizedName.includes('3-piece');

  return isSingleKurti && !isSet;
}

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
