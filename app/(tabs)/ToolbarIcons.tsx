import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

// ─── Individual Icon Components ───────────────────────────────────────────────

export function IconBold({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <SvgText
                x="2" y="15"
                fontSize="16"
                fontWeight="800"
                fill={color}
                fontFamily="Georgia, serif"
            >B</SvgText>
        </Svg>
    );
}

export function IconItalic({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <SvgText
                x="5" y="15"
                fontSize="15"
                fontStyle="italic"
                fill={color}
                fontFamily="Georgia, serif"
            >I</SvgText>
        </Svg>
    );
}

export function IconUnderline({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <SvgText
                x="3" y="12"
                fontSize="12"
                fontWeight="700"
                fill={color}
                fontFamily="system-ui, sans-serif"
            >U</SvgText>
            <Line x1="2" y1="16" x2="16" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
    );
}

export function IconStrikethrough({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <SvgText
                x="2" y="15"
                fontSize="12"
                fontWeight="600"
                fill={color}
                fontFamily="system-ui, sans-serif"
            >ab</SvgText>
            <Line x1="1" y1="9" x2="17" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </Svg>
    );
}

export function IconHeading({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={22} height={18} viewBox="0 0 22 18">
            <SvgText
                x="0" y="15"
                fontSize="16"
                fontWeight="800"
                fill={color}
                fontFamily="system-ui, sans-serif"
            >{"H\u2081"}</SvgText>
        </Svg>
    );
}

export function IconFontSize({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={26} height={18} viewBox="0 0 26 18">
            <SvgText
                x="0" y="16"
                fontSize="18"
                fontWeight="800"
                fill={color}
                fontFamily="Georgia, serif"
            >A</SvgText>
            <SvgText
                x="17" y="18"
                fontSize="11"
                fontWeight="600"
                fill={color}
                fontFamily="Georgia, serif"
            >a</SvgText>
        </Svg>
    );
}

export function IconFontColor({ color = "#888", activeColor = "#c084fc" }: { color?: string; activeColor?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <SvgText
                x="2" y="13"
                fontSize="14"
                fontWeight="700"
                fill={color}
                fontFamily="Georgia, serif"
            >A</SvgText>
            <Rect x="1" y="14" width="16" height="2.5" rx="1.2" fill={activeColor} />
        </Svg>
    );
}

export function IconHighlight({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <Path
                d="M4 14 L9 3 L14 14"
                stroke={color}
                strokeWidth="1.6"
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <Line x1="6" y1="10" x2="12" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            <Rect x="1" y="15" width="16" height="3" rx="1.5" fill="#fef08a" opacity={0.75} />
        </Svg>
    );
}

export function IconAlignLeft({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <Line x1="1" y1="4" x2="17" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="1" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="1" y1="12" x2="11" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="1" y1="16" x2="14" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
    );
}

export function IconAlignCenter({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <Line x1="1" y1="4" x2="17" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="1" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="4" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="3" y1="16" x2="15" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
    );
}

export function IconAlignRight({ color = "#888" }: { color?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <Line x1="1" y1="4" x2="17" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="1" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <Line x1="4" y1="16" x2="17" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
    );
}

export function IconMood({ color = "#888", hasEmotion = false, emotionColor = "#34d399" }: { color?: string; hasEmotion?: boolean; emotionColor?: string }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 18 18">
            <Circle cx="9" cy="9" r="7" stroke={hasEmotion ? emotionColor : color} strokeWidth="1.4" fill="none" />
            <Circle cx="6.5" cy="7.5" r="1.1" fill={hasEmotion ? emotionColor : color} />
            <Circle cx="11.5" cy="7.5" r="1.1" fill={hasEmotion ? emotionColor : color} />
            {hasEmotion ? (
                <Path d="M6 11.5 Q9 14 12 11.5" stroke={emotionColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            ) : (
                <Line x1="6" y1="12" x2="12" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            )}
        </Svg>
    );
}

// ─── ToolBtn — drop-in replacement ───────────────────────────────────────────
// Replace the old ToolBtn in NoteForm.tsx with this one.
// Usage examples:
//   <ToolBtn icon="bold"        active={!!fmt.bold}        onPress={() => toggleFmt("bold")} />
//   <ToolBtn icon="italic"      active={!!fmt.italic}      onPress={() => toggleFmt("italic")} />
//   <ToolBtn icon="underline"   active={!!fmt.underline}   onPress={() => toggleFmt("underline")} />
//   <ToolBtn icon="strike"      active={!!fmt.strikethrough} onPress={() => toggleFmt("strikethrough")} />
//   <ToolBtn icon="heading"     active={!!fmt.heading}     onPress={() => setPicker("heading")} />
//   <ToolBtn icon="fontSize"    onPress={() => setPicker("fontSize")} />
//   <ToolBtn icon="color"       onPress={() => setPicker("color")}    activeColor={fmt.color ?? journalColor} />
//   <ToolBtn icon="highlight"   active={!!fmt.highlight}   onPress={() => setPicker("highlight")} />
//   <ToolBtn icon="alignLeft"   active={fmt.align === "left"}   onPress={() => applyFmt({ align: "left" })} />
//   <ToolBtn icon="alignCenter" active={fmt.align === "center"} onPress={() => applyFmt({ align: "center" })} />
//   <ToolBtn icon="alignRight"  active={fmt.align === "right"}  onPress={() => applyFmt({ align: "right" })} />
//   <ToolBtn icon="mood" onPress={() => setPicker("mood")} hasEmotion={!!emotion} emotionColor={emotion?.color} />

type IconName =
    | "bold" | "italic" | "underline" | "strike"
    | "heading" | "fontSize"
    | "color" | "highlight"
    | "alignLeft" | "alignCenter" | "alignRight"
    | "mood";

export function ToolBtn({
    icon,
    active,
    onPress,
    activeColor = "#c084fc",
    hasEmotion,
    emotionColor,
}: {
    icon: IconName;
    active?: boolean;
    onPress: () => void;
    activeColor?: string;
    hasEmotion?: boolean;
    emotionColor?: string;
}) {
    const iconColor = active ? activeColor : "#888";

    const renderIcon = () => {
        switch (icon) {
            case "bold": return <IconBold color={iconColor} />;
            case "italic": return <IconItalic color={iconColor} />;
            case "underline": return <IconUnderline color={iconColor} />;
            case "strike": return <IconStrikethrough color={iconColor} />;
            case "heading": return <IconHeading color={iconColor} />;
            case "fontSize": return <IconFontSize color={iconColor} />;
            case "color": return <IconFontColor color="#888" activeColor={activeColor} />;
            case "highlight": return <IconHighlight color={active ? "#fef08a" : "#888"} />;
            case "alignLeft": return <IconAlignLeft color={iconColor} />;
            case "alignCenter": return <IconAlignCenter color={iconColor} />;
            case "alignRight": return <IconAlignRight color={iconColor} />;
            case "mood": return <IconMood color="#888" hasEmotion={hasEmotion} emotionColor={emotionColor} />;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[tb.btn, active && tb.btnActive, { backgroundColor: active ? activeColor + "22" : "#1c1c1c" }]}
        >
            {renderIcon()}
        </TouchableOpacity>
    );
}

const tb = StyleSheet.create({
    btn: {
        minWidth: 36,
        height: 34,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    btnActive: {
        borderWidth: 1,
        borderColor: "#c084fc33",
    },
});