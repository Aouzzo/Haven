# Generated artwork and prompts

> Update (3D hero branch): the home page no longer uses generated images. It is a Three.js scene built from simple shapes in code. `exterior.png` and both resident sprite sheets were removed; `hallway-empty.png` is still used on `/technology` and `/login`. The prompts below are kept for provenance.

The four calls below used **built-in image generation**, not the CLI/API fallback. All selected assets are saved in `public/assets/scenes/`. The user-supplied art-direction reference is `../Safer Assisted Living, Smarter Care.png`; it is not displayed as a website background.

## Exterior — exterior.png

Reference: supplied collage. Original output: `exec-9ce15725-6aa6-47f6-9ef7-633981e97c21.png`.

> Generate a single standalone 16:9 landscape image at 2048x1152 or higher. Attached image is ONLY art direction reference. Recreate and expand its upper-left luxury mountain lodge assisted living exterior into a premium full-frame cinematic environment. Rich natural stone, oak timber beams, beautiful mature landscaping, sage planting, warm cream plaster, reassuring glowing windows, mountains behind, warm golden-hour sunlight. Wide eye-level establishing view of welcoming entrance, premium stylized-realistic animated-film rendering, exquisite materials and landscaping. Architectural visualization with natural softness, elegant composition with entrance near center, rich warm shadows. No typography, signs, logo, people, collage panels or border. No healthcare institutional aesthetic. Fill entire landscape frame with this one exterior scene. This is a local website hero background, not a website mockup.

The tool returned 1672 × 941; the native output was retained and visually reviewed at desktop size, not artificially enlarged into a replacement file.

## Hallway — hallway-empty.png

Reference: supplied collage. Original output: `exec-297f5013-7411-4d73-a3d5-76c86a653177.png`.

> Generate a single cinematic 16:9 landscape image at highest native quality, ideally 2048x1152. Attached collage is art-direction reference only, use its upper-right hallway. Create one full-frame empty luxury assisted living hallway, same mountain lodge world: creamy plaster, oak doorframes and timber ceiling beams, sage upholstered lounge chairs, potted ficus trees, framed landscape paintings, subtly reflective warm limestone floor, understated glowing ceiling lights, sunny comfortable lounge at far end. Premium stylized-realistic 3D animated-film architectural visualization, exquisite materials, soft late afternoon natural light, warm reassuring atmosphere. Wide balanced architectural view camera eye level 1.4m, 28mm lens, centered vanishing point. Plenty of visible floor, unobstructed upper left and right cream wall areas for composited small sensors. Strong natural perspective, understated cinematic grading. No people, no sensing devices, no radio waves, no typography, no logos, no interface, no collage, no borders. This is an immaculate clean background plate for a premium product film.

The tool returned 1672 × 941. The same exact hallway is reused throughout installation, walking and detection, preserving architectural consistency.

## Resident animation sheet — resident-sprites.png

References: supplied collage and generated hallway. Original output: `exec-21673279-94c3-432a-b31c-26f05e664abc.png`. Requested transparent background.

> Create a precision character animation sprite sheet, transparent background, 1536x1024, exactly THREE equal 512px columns and TWO equal 512px rows, no borders, grid lines or labels. Reference image 1 shows desired elderly grandmother in bottom left, image 2 provides light/style only. Every tile contains SAME premium stylized-realistic 3D animated-film grandmother: short curly silver hair, small round glasses, kind expressive face, cream blouse, oatmeal cardigan, taupe pants, comfortable brown shoes. Warm soft sunlight from left, subtle ambient shadows, coherent detailed anatomy and fabric. All poses full body, camera fixed nearly front with slight three-quarter turn, 1.4m camera height, gently looking forward. Within EACH tile use same character scale: standing height approx 400px with top at cell y=60, soles at cell y=465, x center=256. Do not crop limbs. Top row left: walking left foot forward right back, arms counter swing. Top row middle: walk passing pose feet nearly aligned, right knee gently forward. Top row right: walking right foot forward left back, arms counter swing. Bottom row left: walk second passing pose left knee forward. These FOUR images form a graceful gentle walking cycle. Bottom row middle: SAME grandmother AFTER a possible fall, seated resting on floor, torso upright gently leaning, one palm supporting her, legs bent to side, calm composed expression, no pain or injury. For seated pose keep same head size/character scale as standing, lowest shoe at y465, center x256, entirely within tile. Bottom row right: repeat SAME seated pose with head slightly raised. Actual alpha transparent background, no floor, no scene, no baked shadows beyond a very light contact shadow, no text. This is a reusable isolated character sprite asset for a compassionate assisted living product demo, not a collage presentation.

## Clean final resident sheet — resident-sprites-clean.png

Edit target: first resident sheet. Original output: `exec-c80a1cb7-d0cc-48d8-80bc-0fff8e67199e.png`. Transparent background enabled. This is the sheet loaded by the website.

> Precise background extraction edit of this sprite sheet. Preserve all six characters, exact pose, rendering detail, skin, hair, clothing, scale, and EXACT pixel positions. Keep image 1536x1024 with same 3-column, 2-row layout. Remove ALL the brown, black, tan atmospheric gradient glow and haze around each character. Background must be COMPLETELY transparent alpha=0 everywhere outside character silhouettes. No background shadows, no ground, no aura, no surrounding glow. Keep natural detailed anti-aliased edges of hair and clothes. This is a production sprite sheet to composite over architecture; any residual haze will create visible rectangular tiles. Do not alter any poses or add content.

Alpha transparency was checked in the PNG and the result inspected composited in the browser. The tool's inline preview can show RGB color under transparent pixels; the website respects the alpha channel.
