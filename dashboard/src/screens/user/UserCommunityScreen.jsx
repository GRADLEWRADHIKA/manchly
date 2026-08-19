import React from "react";
import {Sparkle} from "lucide-react";
import colors from "../../utils/colors";

export default function CommunityScreen(){
    return (
        <div
         style={{
            minHeight: "70h",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 40
         }}
        >
        <div
         style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: colors.user?.accentSoft || "#ECFDF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
         }}
        >
           <Sparkle size={28} color={colors.user?.accent}/>
        </div>
        <h1 style={{margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: colors.user?.text}}>
            Community
        </h1>
        <p style={{margin: 0, fontSize: 14.5, color: colors.user?.subHeading, maxWidth: 360}}>
            Coming soon 
        </p>
        </div>
    )
}