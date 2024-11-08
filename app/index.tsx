import React, { useEffect, useState } from "react";
import {
  Canvas,
  useImage,
  Image,
  rotateX,
  Group,
  Text,
  matchFont,
} from "@shopify/react-native-skia";
import { Platform, useWindowDimensions } from "react-native";
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";

const Gravity = 1000;
const JUMP_FORCE = -500;
const App = () => {
  const { width, height } = useWindowDimensions();
  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/redbird-midflap.png"));
  const pipedown = useImage(require("../assets/sprites/pipe-red.png"));
  const pipeup = useImage(require("../assets/sprites/pipe-red-top.png"));
  const base = useImage(require("../assets/sprites/base.png"));
const [score,setScore]=useState<number>(0)
  const x = useSharedValue(width);
  const birdY = useSharedValue(height / 3);
  const birdYVeleocity = useSharedValue(0);
 const birdPosition={
    x:width / 7
 }
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  }, []);

  useAnimatedReaction(
    () =>  x.value,
     
    (currentValue, previousValue) => {
        const middle=birdPosition.x
      if (currentValue !== previousValue &&previousValue && currentValue<=middle && previousValue > middle) {
        // setScore((s)=>s++) wont workcus state is on JS thread and useAnimated is on UI thread
        runOnJS(setScore)(score+1)
      }
    }
  );


  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt) {
      return;
    }
    birdY.value = birdY.value + (birdYVeleocity.value * dt) / 1000;
    birdYVeleocity.value = birdYVeleocity.value + (Gravity * dt) / 1000;
  });

  const gesture = Gesture.Tap().onStart(() => {
    birdYVeleocity.value = JUMP_FORCE;
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVeleocity.value,
          [-500, 500],
          [-0.5, 0.5],
          Extrapolation.CLAMP
        ),
      },
    ];
  });

  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 37, y: birdY.value + 29 };
  });

  const pipeOffset = 0;
  const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    // fontWeight: 'bold',
  };
  const font = matchFont(fontStyle);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas
          style={{ width, height }}
          //  onTouchStart={()=>(birdYVeleocity.value=-300)}
        >
          <Image image={bg} width={width} height={height} fit={"cover"} />

          <Image
            image={pipeup}
            y={pipeOffset - 320}
            x={x}
            width={104}
            height={640}
            fit={"contain"}
          />
          <Image
            image={pipedown}
            y={height - 330 + pipeOffset}
            x={x}
            width={104}
            height={640}
            fit={"contain"}
          />

          <Group transform={birdTransform} origin={birdOrigin}>
            <Image
              image={bird}
              y={birdY}
              x={birdPosition.x}
              width={74}
              height={58}
              fit={"contain"}
            />
          </Group>

          <Image
            image={base}
            y={height - 75}
            x={0}
            width={width}
            height={150}
            fit={"cover"}
          />
         <Text
            x={width / 2 - 30}
            y={100}
            text={score.toString()}
            font={font}
          />

        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
