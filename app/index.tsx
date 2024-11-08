import React, { useEffect } from "react";
import { Canvas,useImage,Image } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";
import { useSharedValue, withTiming,Easing,withSequence,withRepeat } from "react-native-reanimated";

const App = () => {
const {width,height}=useWindowDimensions()
const bg =useImage(require('../assets/sprites/background-day.png'))
const bird=useImage(require('../assets/sprites/redbird-midflap.png'))
const pipedown=useImage(require('../assets/sprites/pipe-red.png'))
const pipeup=useImage(require('../assets/sprites/pipe-red-top.png'))
const base=useImage(require('../assets/sprites/base.png'))

const x=useSharedValue(width)
useEffect(()=>{
    x.value=withRepeat(withSequence(
        withTiming(-150,{duration:5000,easing:Easing.linear}),
        withTiming(width,{duration:0}),
    ) ,-1
)
},[])

const pipeOffset=0

  return (
    <Canvas style={{ width, height }}>
      <Image image={bg} width={width} height={height} fit={"cover"}/>

      <Image  image={pipeup} y={pipeOffset-320} x={x} width={104} height={640} fit={"contain"}/>
      <Image  image={pipedown} y={height-330+pipeOffset} x={x} width={104} height={640} fit={"contain"}/>

      <Image  image={bird} y={height/2-14} x={width/7} width={74} height={58} fit={"contain"}/>
      
      <Image  image={base} y={height-75} x={0} width={width} height={150} fit={"cover"}/>
    </Canvas>
  );
};
 
export default App;