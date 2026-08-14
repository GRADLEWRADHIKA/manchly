import React, { useRef } from "react";
import { Upload } from "lucide-react";
import colors from "../../../../utils/colors";

export default function ThumbnailDropzone({ previewUrl, onFileSelect }) {
  const inputRef = useRef(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        height: "100%",
        minHeight: 280,
        borderRadius: 16,
        border: `2px dashed ${colors.base.border}`,
        background: "rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
        style={{ display: "none" }}
      />

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Course thumbnail preview"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: colors.brand.primaryOrange,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Upload size={24} color={colors.typography.white} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.typography.primaryText, marginBottom: 4 }}>
            Upload Course Thumbnail
          </span>
          <span style={{ fontSize: 12, color: colors.typography.secondaryText }}>
            JPG, PNG or WebP
          </span>
        </>
      )}
    </div>
  );
}