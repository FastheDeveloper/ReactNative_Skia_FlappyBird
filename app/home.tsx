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
  RoundedRect,
} from "@shopify/react-native-skia";
import {
  Platform,
  Pressable,
  useWindowDimensions,
  Text as Texts,
  View,
} from "react-native";
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
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const Gravity = 1000;
const JUMP_FORCE = -500;
const App = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/redbird-midflap.png"));
  const pipedown = useImage(require("../assets/sprites/pipe-red.png"));
  const pipeup = useImage(require("../assets/sprites/pipe-red-top.png"));
  const base = useImage(require("../assets/sprites/base.png"));
  const [score, setScore] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound>();
  const [pointSound, setPointSound] = useState<Audio.Sound>();
  const [hitSound, setHitSound] = useState<Audio.Sound>();
  const pipeX = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdYVeleocity = useSharedValue(0);
  const birdX = width / 7;

  const gameOver = useSharedValue(false);
  const pipeWidth = 104;
  const pipeHeigh = 640;

  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 330 + pipeOffset.value);
  const [highScore, setHighScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [newHighScore, setNewHighScore] = useState<boolean>(false);
  const pipeSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 20], [1, 2]);
  });
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
    },
  ]);

  const movePipes = () => {
    pipeX.value = withSequence(
      withTiming(width, { duration: 0 }),
      withTiming(-150, {
        duration: 3000 / pipeSpeed.value,
        easing: Easing.linear,
      }),
      withTiming(width, { duration: 0 })
    );
  };
  useEffect(() => {
    movePipes();
  }, []);

  async function playFlap() {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/audio/flap.mp3"),{
        volume: 0.4
      }
    );
    setSound(sound);

    await sound.playAsync();
  }

  async function playPoint() {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/audio/point.wav"),{
        volume: 0.4
      }
    );
    setPointSound(sound);

    await sound.playAsync();
  }

  async function playHit() {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/audio/sfx_hit.wav"),{
        volume: 0.2,
      }
    );
    setHitSound(sound);

    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    return pointSound
      ? () => {
          pointSound.unloadAsync();
        }
      : undefined;
  }, [pointSound]);

  useEffect(() => {
    return hitSound
      ? () => {
          hitSound.unloadAsync();
        }
      : undefined;
  }, [hitSound]);

  //score system
  useAnimatedReaction(
    () => pipeX.value,

    (currentValue, previousValue) => {
      const middle = birdX;

      //change pipe gap position
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
        cancelAnimation(pipeX);
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
        runOnJS(playPoint)();
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
    );
  };

  //Ground Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const center = {
        x: birdX + 37,
        y: birdY.value + 29,
      };
      if (currentValue > height - 120 || currentValue < 0) {
        // runOnJS(playHit)();
        if (!gameOver.value) {
          // Only play sound if game wasn't already over
          runOnJS(playHit)();
        }
        gameOver.value = true;
        runOnJS(setIsGameOver)(true);
        // runOnJS(router.back)();
        // cancelAnimation(x)
      }

      const isColliding = obstacles.value.some((rect) =>
        isPOintCollidingWithRect(center, rect)
      );

      if (isColliding && !gameOver.value) {
        // runOnJS(playHit)();
        runOnJS(playHit)();
        gameOver.value = true;
        runOnJS(setIsGameOver)(true);
        // runOnJS(router.back)();
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

  // Modified handleGameOver function with more defensive coding
  const handleGameOver = async (finalScore: number) => {
    try {
      // Ensure we're working with valid numbers
      const validScore = Math.max(0, Math.floor(finalScore));

      // Load the current high score directly from storage
      const savedScore = await AsyncStorage.getItem("highScore");
      const currentHighScore = savedScore ? parseInt(savedScore, 10) : 0;

      // Only update if the new score is higher
      if (validScore > currentHighScore) {
        await AsyncStorage.setItem("highScore", validScore.toString());
        // Update state after successful storage
        setNewHighScore(true);
        setHighScore(validScore);
      }
    } catch (error) {
      console.error("Error handling game over:", error);
    }
  };

  console.log(highScore);
  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
        // Ensure score is a valid number before passing
        const finalScore = typeof score === "number" ? score : 0;
        runOnJS(handleGameOver)(finalScore);
      }
    }
  );

  const restartGame = () => {
    "worklet";
    birdY.value = height / 3;
    birdYVeleocity.value = 0;
    pipeX.value = width;
    gameOver.value = false;
    runOnJS(setIsGameOver)(false);
    runOnJS(setScore)(0);
    runOnJS(movePipes)();
    runOnJS(setNewHighScore)(false);
  };
  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVeleocity.value * dt) / 1000;
    birdYVeleocity.value = birdYVeleocity.value + (Gravity * dt) / 1000;
  });

  const gesture = Gesture.Tap().onStart(() => {
    console.log("tap");
    if (gameOver.value) {
    //   restartGame();

    } else {
      birdYVeleocity.value = JUMP_FORCE;
      runOnJS(playFlap)();
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

  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const savedScore = await AsyncStorage.getItem("highScore");
      if (savedScore !== null) {
        setHighScore(Number(savedScore));
      }
    } catch (error) {
      console.error("Error loading high score:", error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <>
          <Canvas style={{ width, height }}>
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

            {/* {isGameOver && (
            <>
              <Group>
                <Rect
                  x={0}
                  y={0}
                  width={width}
                  height={height}
                  color="rgba(0, 0, 0, 0.5)"
                />

                <Text
                  x={width / 2 - 120}
                  y={height / 2 - 50}
                  text="Game Over"
                  font={font}
                  color="white"
                />

                <Text
                  x={width / 2 - 80}
                  y={height / 2 + 20}
                  text={`Score: ${score.toString()}`}
                  font={font}
                  color="white"
                />
              </Group>
            </>
          )} */}
          </Canvas>

          {isGameOver && (
            <View
              style={{
                position: "absolute",
                width: width,
                height: height,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "white",
                  padding: 30,
                  borderRadius: 20,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <Texts
                  style={{
                    color: "#333",
                    fontSize: 40,
                    fontFamily: Platform.select({
                      ios: "Helvetica",
                      default: "serif",
                    }),
                    marginBottom: 20,
                    fontWeight: "bold",
                  }}
                >
                  Game Over
                </Texts>

                <Texts
                  style={{
                    color: "#333",
                    fontSize: 30,
                    fontFamily: Platform.select({
                      ios: "Helvetica",
                      default: "serif",
                    }),
                    marginBottom: 10,
                  }}
                >
                  Score: {score}
                </Texts>
                {newHighScore && (
                  <Texts
                    style={{ color: "green", fontSize: 20, marginBottom: 10 }}
                  >
                    New High Score! {score}
                  </Texts>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    gap: 20,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      console.log("Try Again pressed");
                      restartGame();
                    }}
                    style={{
                      backgroundColor: "brown",
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 10,
                    }}
                  >
                    <Texts
                      style={{
                        color: "white",
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      Try Again
                    </Texts>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      console.log("Home pressed");
                      setIsGameOver(false);

                      //   router.back();
                      router.navigate("/");
                    }}
                    style={{
                      backgroundColor: "teal",
                      paddingVertical: 12,
                      paddingHorizontal: 30,
                      borderRadius: 10,
                    }}
                  >
                    <Texts
                      style={{
                        color: "white",
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      Home
                    </Texts>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
