import { Request, Response, NextFunction } from "express";

const VALID_NICHES = ["Finance", "AI", "Beauty", "Fitness", "SaaS"] as const;
const URL_REGEX = /^https?:\/\/.+\..+/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,15}$/;

const validateCreatorProfile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body = req.body;
  const fields: Record<string, string> = {};

  // niche
  if (!VALID_NICHES.includes(body.niche)) {
    fields.niche = `Must be one of: ${VALID_NICHES.join(", ")}`;
  }

  // phone
  if (!PHONE_REGEX.test(body.phone)) {
    fields.phone = "Must contain 10–15 digits only";
  }

  // instagram
  if (
    typeof body.instagram !== "string" 
    //body.instagram.includes("@") ||
    //body.instagram.includes(" ") ||
    //body.instagram.toLowerCase().includes("http")
  ) {
    fields.instagram = "Must be a bare handle — no @, spaces, or URL prefix";
  }

  // followers, engagementRate, avgViews — non-empty strings
  for (const field of ["followers", "engagementRate", "avgViews"] as const) {
    if (typeof body[field] !== "string" || body[field].trim() === "") {
      fields[field] = "Must be a non-empty string";
    }
  }

  // audience — array of { label, value }, max 8 items
  if (!Array.isArray(body.audience)) {
    fields.audience = "Must be an array";
  } else if (body.audience.length > 8) {
    fields.audience = "Maximum 8 items allowed";
  } else {
    for (const item of body.audience) {
      if (typeof item.label !== "string" || typeof item.value !== "string") {
        fields.audience = "Each item must have string label and value";
        break;
      }
    }
  }

  // packages — array of { label, value }, max 8 items
  if (!Array.isArray(body.packages)) {
    fields.packages = "Must be an array";
  } else if (body.packages.length > 8) {
    fields.packages = "Maximum 8 items allowed";
  } else {
    for (const item of body.packages) {
      if (typeof item.label !== "string" || typeof item.value !== "string") {
        fields.packages = "Each item must have string label and value";
        break;
      }
    }
  }

  const linkFields = [
    { key: "links.education", value: body.links?.education },
    { key: "links.collabs", value: body.links?.collabs   },
    { key: "links.consulting",value: body.links?.consulting},
    { key: "links.ugc",  value: body.links?.ugc       },
  ];

  for (const { key, value } of linkFields) {
    if (typeof value === "string" && value.trim() !== "") {
      const isUrl   = value.startsWith("http") && URL_REGEX.test(value);
      const isEmail = value.includes("@") && EMAIL_REGEX.test(value);
      if (!isUrl && !isEmail) {
        fields[key] = "Must be a valid URL (https://…) or email address";
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    res.status(422).json({ success: false, error: "VALIDATION_FAILED", fields });
    return;
  }

  next();
};

export default validateCreatorProfile;
