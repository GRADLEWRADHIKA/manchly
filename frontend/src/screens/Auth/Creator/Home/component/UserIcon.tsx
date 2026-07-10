import * as React from "react"
import Svg, { Circle, Path, Ellipse, SvgProps } from "react-native-svg"
import { wp, hp } from "../../../../../utils/responsive"

function UserIcon(props: React.JSX.IntrinsicAttributes & React.JSX.IntrinsicClassAttributes<Svg> & Pick<Readonly<SvgProps>, "filter" | "fill" | "pointerEvents" | "hitSlop" | "children" | "id" | "needsOffscreenAlphaCompositing" | "onLayout" | "removeClippedSubviews" | "style" | "testID" | "nativeID" | "collapsable" | "collapsableChildren" | "onBlur" | "onFocus" | "renderToHardwareTextureAndroid" | "focusable" | "tabIndex" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onStartShouldSetResponder" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerDown" | "onPointerDownCapture" | "onPointerUp" | "onPointerUpCapture" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "aria-label" | "accessibilityRole" | "accessibilityState" | "aria-busy" | "aria-checked" | "aria-disabled" | "aria-expanded" | "aria-selected" | "accessibilityHint" | "accessibilityValue" | "aria-valuemax" | "aria-valuemin" | "aria-valuenow" | "aria-valuetext" | "onAccessibilityAction" | "importantForAccessibility" | "aria-hidden" | "aria-modal" | "role" | "accessibilityLabelledBy" | "aria-labelledby" | "accessibilityLiveRegion" | "aria-live" | "screenReaderFocusable" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "accessibilityLanguage" | "accessibilityShowsLargeContentViewer" | "accessibilityLargeContentTitle" | "accessibilityRespondsToUserInteraction" | "width" | "height" | "viewBox" | "color" | "title" | "opacity" | "fillOpacity" | "fillRule" | "stroke" | "strokeWidth" | "strokeOpacity" | "strokeDasharray" | "strokeDashoffset" | "strokeLinecap" | "strokeLinejoin" | "strokeMiterlimit" | "vectorEffect" | "clipRule" | "clipPath" | "translate" | "translateX" | "translateY" | "origin" | "originX" | "originY" | "scale" | "scaleX" | "scaleY" | "skew" | "skewX" | "skewY" | "rotation" | "x" | "y" | "transform" | "disabled" | "onPress" | "onPressIn" | "onPressOut" | "onLongPress" | "delayPressIn" | "delayPressOut" | "delayLongPress" | "marker" | "markerStart" | "markerMid" | "markerEnd" | "mask" | "font" | "fontStyle" | "fontVariant" | "fontWeight" | "fontStretch" | "fontSize" | "fontFamily" | "textAnchor" | "textDecoration" | "letterSpacing" | "wordSpacing" | "kerning" | "fontFeatureSettings" | "fontVariantLigatures" | "fontVariationSettings"> & { readonly preserveAspectRatio?: string | undefined } & {}) {
  return (
    <Svg
      width={wp(54)}
      height={hp(54)}
      viewBox="0 0 36 36"
      fill="none"
    //   xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Circle
        cx={18.0003}
        cy={14.9525}
        r={5.33333}
        stroke="white"
        strokeWidth={2.66667}
        strokeLinecap="round"
      />
      <Circle cx={18} cy={18} r={16} stroke="#7C3AED" strokeWidth={4} />
      <Path
        d="M27.905 29.428c-.63-1.748-2.016-3.294-3.945-4.396-1.928-1.102-4.291-1.699-6.722-1.699s-4.794.597-6.723 1.7C8.587 26.133 7.2 27.68 6.571 29.427"
        stroke="white"
        strokeWidth={2.66667}
        strokeLinecap="round"
      />
      <Ellipse
        cx={16.9231}
        cy={28.9297}
        rx={10.509}
        ry={4.5977}
        fill="white"
      />
      <Circle cx={18.2369} cy={15.1364} r={5.25452} fill="white" />
    </Svg>
  )
}

export default UserIcon
