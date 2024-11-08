import React, { useEffect, useState } from "react";
import {
  Canvas,
  useImage,
  Image,
  rotateX,
  Group,
  Text,
  matchFont,
  Circle,
  Rect,
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
  cancelAnimation,
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
  const [score, setScore] = useState<number>(0);
  const pipeX = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdYVeleocity = useSharedValue(0);
  const birdX =width / 7
 
  const gameOver = useSharedValue(false);
  const pipeWidth = 104;
  const pipeHeigh = 640;


  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 330 + pipeOffset.value);
const pipeSpeed=useDerivedValue(()=>{
    return interpolate(score,[0,20],[1,4])
})
  const obstacles = useDerivedValue(() => [

    //add bottom pipe
{
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeigh,
      w: pipeWidth,
    },

    //add top pipe
   {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeigh,
      w: pipeWidth,
    }

]);


  const movePipes = () => {
    pipeX.value = 
      withSequence(
        withTiming(width, { duration: 0 }),
        withTiming(-150, { duration: 3000 /pipeSpeed.value, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      )
 
  };
  useEffect(() => {
    movePipes();
  }, []);

  //score system
  useAnimatedReaction(
    () => pipeX.value,

    (currentValue, previousValue) => {
      const middle =birdX;

      //change pipe gap position
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
        cancelAnimation(pipeX)
        runOnJS(movePipes)();

      }
      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        // setScore((s)=>s++) wont workcus state is on JS thread and useAnimated is on UI thread
        runOnJS(setScore)(score + 1);
      }
    }
  );

  const isPOintCollidingWithRect = (
    point: { x: any; y: any },
    rect: { x: any; y: any; h: any; w: any }
  ) => {
    //Bottom pipe
    "worklet";
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h
      // console.log("To the right")
    );
  };

  //Ground Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {

        const center={
            x:birdX+ 37,
            y:birdY.value + 29
        }
      if (currentValue > height - 120 || currentValue < 0) {
        // console.log("end game ")
        gameOver.value = true;
        // cancelAnimation(x)
      }

      const isColliding = obstacles.value.some((rect) =>
        isPOintCollidingWithRect(
          center,
          rect
        )
      );

      if (isColliding) {
        gameOver.value = true;
      }
      //   //Bottom pipe
      //   if (
      //     birdCenterX.value >= x.value &&
      //     birdCenterX.value <= x.value + pipeWidth &&
      //     birdCenterY.value >= height - 330 + pipeOffset &&
      //     birdCenterY.value <= height - 330 + pipeOffset + pipeHeigh
      //   ) {
      //     gameOver.value = true;
      //     // console.log("To the right")
      //   }

      //   //    //Top pipe
      //   if (
      //     birdCenterX.value >= x.value &&
      //     birdCenterX.value <= x.value + pipeWidth &&
      //     birdCenterY.value >= pipeOffset - 320 &&
      //     birdCenterY.value <= pipeOffset - 320 + pipeOffset + pipeHeigh
      //   ) {
      //     gameOver.value = true;
      //     // console.log("To the right")
      //   }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
      }
    }
  );

  const restartGame = () => {
    "worklet";
    birdY.value = height / 3;
    birdYVeleocity.value = 0;
    pipeX.value = width;
    gameOver.value = false;

    runOnJS(setScore)(0);
    runOnJS(movePipes)();
  };
  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVeleocity.value * dt) / 1000;
    birdYVeleocity.value = birdYVeleocity.value + (Gravity * dt) / 1000;
  });

  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      restartGame();
    } else {
      birdYVeleocity.value = JUMP_FORCE;
    }
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

  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
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
            y={topPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeigh}
            fit={"contain"}
          />
          <Image
            image={pipedown}
            y={bottomPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeigh}
            fit={"contain"}
          />

          <Group transform={birdTransform} origin={birdOrigin}>
            <Image
              image={bird}
              y={birdY}
              x={birdX}
              width={74}
              height={58}
              fit={"contain"}
            />
          </Group>

          {/* <Circle cx={birdCenterX} cy={birdCenterY} r={5} color={'red'}/> */}

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
