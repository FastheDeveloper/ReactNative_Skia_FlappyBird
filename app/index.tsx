import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  useWindowDimensions,
  TouchableOpacity,
  Pressable,
  StatusBar,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect } from "expo-router";

const index = () => {
  const { width, height } = useWindowDimensions();
  const [highScore, setHighScore] = useState(0);

  const loadHighScore = async () => {
    try {
      const savedScore = await AsyncStorage.getItem('highScore');
      if (savedScore !== null) {
        setHighScore(parseInt(savedScore));
      }
    } catch (error) {
      console.error('Error loading highscore:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHighScore();
    }, [])
  );



  return (
    <ImageBackground
      style={{ width, height }}
      resizeMode="cover"
      source={require("../assets/images/homepage.jpg")}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Link
          href="/home"
          asChild
          style={{ backgroundColor: "red", position: "absolute" }}
        >
          <Pressable
            style={{
              backgroundColor: "white",
              padding: 10,
              borderRadius: 10,
              width: width / 2,
              alignItems: "center",
              bottom: height / 4,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "black" }}>
              Start
            </Text>
          </Pressable>
        </Link>

        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" ,bottom:height/6,position:"absolute"}}>
          High Score: {highScore}
        </Text>
      </View>
    </ImageBackground>
  );
};

export default index;

const styles = StyleSheet.create({});
