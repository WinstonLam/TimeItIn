export const themes = {
  aqua: {
    primary: "96, 150, 180",
    second: "173, 196, 206",
    third: "238, 224, 201",
    text: "241, 240, 232",
  },
  midnight: {
    primary: "7, 15, 43",
    second: "27, 26, 85",
    third: "83, 92, 145",
    text: "146, 144, 195",
  },
  sunny: {
    primary: "254, 255, 210",
    second: "255, 238, 169",
    third: "255, 191, 120",
    text: "255, 125, 41",
  },
  candy: {
    primary: "249, 245, 246",
    second: "248, 232, 238",
    third: "253, 206, 223",
    text: "242, 190, 209",
  },
  forest: {
    primary: "37, 67, 54",
    second: "107, 138, 122",
    third: "183, 181, 151",
    text: "218, 211, 190",
  },
};

export type ThemeNames = keyof typeof themes;
export type ThemeProps = (typeof themes)[ThemeNames];
