export const themes = {
  aqua: {
    primary: "18, 72, 107",
    second: "65, 145, 151",
    third: "120, 214, 198",
    fourth: "245, 252, 205",
  },
  midnight: {
    primary: "7, 15, 43",
    second: "27, 26, 85",
    third: "83, 92, 145",
    fourth: "146, 144, 195",
  },
  sunny: {
    primary: "254, 255, 210",
    second: "255, 238, 169",
    third: "255, 191, 120",
    fourth: "255, 125, 41",
  },
};

export type ThemeNames = keyof typeof themes;
export type ThemeProps = (typeof themes)[ThemeNames];
