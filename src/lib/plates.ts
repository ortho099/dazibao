import cat from "@/assets/plates/cat.jpg";
import rain from "@/assets/plates/rain.jpg";
import doors from "@/assets/plates/doors.jpg";
import dog from "@/assets/plates/dog.jpg";
import desk from "@/assets/plates/desk.jpg";
import microwave from "@/assets/plates/microwave.jpg";

export type Plate = {
  id: string;
  name: string;
  src: string;
};

export const PLATES: Plate[] = [
  { id: "cat", name: "橘貓", src: cat },
  { id: "rain", name: "雨窗", src: rain },
  { id: "doors", name: "兩扇門", src: doors },
  { id: "dog", name: "金毛", src: dog },
  { id: "desk", name: "燈下", src: desk },
  { id: "microwave", name: "微波爐", src: microwave },
];
