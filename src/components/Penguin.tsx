import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { MoodLevel } from '../engine/cycle';

// Original cartoon penguin. The face (eyes, brows, mouth, extras) changes with mood level 1..5.
const NAVY = '#2B2D52';
const BELLY = '#FFFFFF';
const ORANGE = '#FFA63D';
const CHEEK = '#FFB38A';

function Eyes({ level }: { level: MoodLevel }) {
  const L = 118, R = 182, Y = 112;
  switch (level) {
    case 5: // happy closed arcs ^ ^
      return (
        <G stroke={NAVY} strokeWidth={6} strokeLinecap="round" fill="none">
          <Path d={`M${L - 14} ${Y + 4} Q${L} ${Y - 16} ${L + 14} ${Y + 4}`} />
          <Path d={`M${R - 14} ${Y + 4} Q${R} ${Y - 16} ${R + 14} ${Y + 4}`} />
        </G>
      );
    case 6: // wink + heart-struck eye
      return (
        <G>
          <Path d={`M${L - 14} ${Y + 4} Q${L} ${Y - 14} ${L + 14} ${Y + 4}`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Circle cx={R} cy={Y} r={14} fill={NAVY} />
          <Path d={`M${R} ${Y + 8} c-12 -8 -10 -18 -3 -18 c3 0 3 2 3 3 c0 -1 0 -3 3 -3 c7 0 9 10 -3 18z`} fill="#FF5C8A" />
          <Path d={`M${L - 18} ${Y - 14} L${L + 12} ${Y - 18}`} stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
        </G>
      );
    case 4: // bright round eyes with sparkle
      return (
        <G>
          <Circle cx={L} cy={Y} r={13} fill={NAVY} />
          <Circle cx={R} cy={Y} r={13} fill={NAVY} />
          <Circle cx={L + 4} cy={Y - 5} r={5} fill="#fff" />
          <Circle cx={R + 4} cy={Y - 5} r={5} fill="#fff" />
        </G>
      );
    case 3: // neutral
      return (
        <G>
          <Circle cx={L} cy={Y} r={10} fill={NAVY} />
          <Circle cx={R} cy={Y} r={10} fill={NAVY} />
          <Circle cx={L + 3} cy={Y - 3} r={3} fill="#fff" />
          <Circle cx={R + 3} cy={Y - 3} r={3} fill="#fff" />
        </G>
      );
    case 2: // grumpy: angled brows, narrowed eyes
      return (
        <G>
          <Circle cx={L} cy={Y + 2} r={9} fill={NAVY} />
          <Circle cx={R} cy={Y + 2} r={9} fill={NAVY} />
          <Path d={`M${L - 16} ${Y - 16} L${L + 14} ${Y - 6}`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
          <Path d={`M${R + 16} ${Y - 16} L${R - 14} ${Y - 6}`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
        </G>
      );
    case 1: // sad: droopy brows, watery eyes, tear
      return (
        <G>
          <Circle cx={L} cy={Y + 2} r={12} fill={NAVY} />
          <Circle cx={R} cy={Y + 2} r={12} fill={NAVY} />
          <Circle cx={L + 3} cy={Y - 2} r={5} fill="#fff" />
          <Circle cx={R + 3} cy={Y - 2} r={5} fill="#fff" />
          <Path d={`M${L - 16} ${Y - 8} L${L + 12} ${Y - 18}`} stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
          <Path d={`M${R + 16} ${Y - 8} L${R - 12} ${Y - 18}`} stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
          <Path d={`M${L - 6} ${Y + 18} Q${L - 12} ${Y + 32} ${L - 6} ${Y + 36} Q${L + 2} ${Y + 32} ${L - 6} ${Y + 18}Z`} fill="#7CC4FF" />
        </G>
      );
  }
}

function Mouth({ level }: { level: MoodLevel }) {
  const cx = 150, y = 160;
  switch (level) {
    case 5:
      return <Path d={`M${cx - 18} ${y} Q${cx} ${y + 30} ${cx + 18} ${y}Z`} fill="#C2334D" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" />;
    case 6: // sly smirk
      return <Path d={`M${cx - 14} ${y + 8} Q${cx + 4} ${y + 20} ${cx + 20} ${y + 2}`} stroke={NAVY} strokeWidth={5} fill="none" strokeLinecap="round" />;
    case 4:
      return <Path d={`M${cx - 16} ${y + 2} Q${cx} ${y + 20} ${cx + 16} ${y + 2}`} stroke={NAVY} strokeWidth={5} fill="none" strokeLinecap="round" />;
    case 3:
      return <Path d={`M${cx - 12} ${y + 8} L${cx + 12} ${y + 8}`} stroke={NAVY} strokeWidth={5} strokeLinecap="round" />;
    case 2:
      return <Path d={`M${cx - 16} ${y + 14} Q${cx} ${y - 2} ${cx + 16} ${y + 14}`} stroke={NAVY} strokeWidth={5} fill="none" strokeLinecap="round" />;
    case 1:
      return <Path d={`M${cx - 16} ${y + 16} Q${cx - 8} ${y + 4} ${cx} ${y + 14} Q${cx + 8} ${y + 4} ${cx + 16} ${y + 16}`} stroke={NAVY} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  }
}

function Extras({ level }: { level: MoodLevel }) {
  if (level === 5)
    return (
      <G>
        <Path d="M40 60 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="#FFD36B" />
        <Path d="M250 50 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="#FFD6A5" />
        <Path d="M262 130 c-6 -10 -20 -2 -12 8 l12 10 12 -10 c8 -10 -6 -18 -12 -8z" fill="#FF7A59" />
      </G>
    );
  if (level === 6)
    return (
      <G>
        <Path d="M262 70 c-8 -12 -24 -2 -14 10 l14 12 14 -12 c10 -12 -6 -22 -14 -10z" fill="#FF5C8A" />
        <Path d="M40 100 c-6 -9 -18 -1 -10 8 l10 9 10 -9 c8 -9 -4 -17 -10 -8z" fill="#FF8FB1" />
        <Path d="M250 150 c-5 -8 -15 -1 -8 7 l8 7 8 -7 c7 -8 -3 -14 -8 -7z" fill="#FFB3CB" />
      </G>
    );
  if (level === 4)
    return (
      <G>
        <Path d="M44 70 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="#FFD36B" />
      </G>
    );
  if (level === 2)
    return (
      <G fill="#C9C2E8">
        <Circle cx={52} cy={70} r={9} />
        <Circle cx={68} cy={58} r={12} />
        <Circle cx={252} cy={72} r={9} />
        <Circle cx={236} cy={58} r={12} />
      </G>
    );
  if (level === 1)
    return (
      <G>
        <Ellipse cx={150} cy={22} rx={50} ry={16} fill="#A9B4D8" />
        <Ellipse cx={120} cy={26} rx={28} ry={14} fill="#A9B4D8" />
        <Ellipse cx={182} cy={26} rx={30} ry={14} fill="#A9B4D8" />
        <G stroke="#7CC4FF" strokeWidth={4} strokeLinecap="round">
          <Path d="M120 46 l-4 14" />
          <Path d="M150 46 l-4 14" />
          <Path d="M180 46 l-4 14" />
        </G>
      </G>
    );
  return null;
}

const FLIP_L = 'M52 170 C20 190 24 232 56 236 C70 214 68 190 52 170Z';
const FLIP_R = 'M248 170 C280 190 276 232 244 236 C230 214 232 190 248 170Z';

function PenguinArt({ level, size = 300, flippers = true }: { level: MoodLevel; size?: number; flippers?: boolean }) {
  const cheeks = level >= 4;
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Extras level={level} />
      {/* feet */}
      <Ellipse cx={108} cy={286} rx={30} ry={11} fill={ORANGE} />
      <Ellipse cx={192} cy={286} rx={30} ry={11} fill={ORANGE} />
      {/* flippers */}
      {flippers && <Path d={FLIP_L} fill={NAVY} />}
      {flippers && <Path d={FLIP_R} fill={NAVY} />}
      {/* body */}
      <Ellipse cx={150} cy={178} rx={104} ry={110} fill={NAVY} />
      <Ellipse cx={150} cy={206} rx={72} ry={80} fill={BELLY} />
      {/* face patch */}
      <Ellipse cx={150} cy={128} rx={78} ry={56} fill={BELLY} />
      <Eyes level={level} />
      {cheeks && (
        <G>
          <Ellipse cx={92} cy={140} rx={13} ry={8} fill={CHEEK} opacity={0.85} />
          <Ellipse cx={208} cy={140} rx={13} ry={8} fill={CHEEK} opacity={0.85} />
        </G>
      )}
      {/* beak */}
      <Path d="M132 134 Q150 124 168 134 Q160 156 150 158 Q140 156 132 134Z" fill={ORANGE} />
      <Mouth level={level} />
      {/* belly highlight */}
      <Rect x={128} y={232} width={44} height={6} rx={3} fill="#F2E9F7" />
    </Svg>
  );
}

const ND = Platform.OS !== 'web';

/** Each mood has its own motion: hop, sway, breathe, angry shake, sad droop. `pulse` triggers a quick pop. */
export default function AnimatedPenguin({ level, size = 300, pulse = 0 }: { level: MoodLevel; size?: number; pulse?: number }) {
  const p = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const w = useRef(new Animated.Value(0)).current; // wandering across the screen
  const f = useRef(new Animated.Value(0)).current; // flipper flapping

  useEffect(() => {
    p.setValue(0);
    const cfg: Record<MoodLevel, { d: number; ease: (t: number) => number; delay?: number }> = {
      6: { d: 1100, ease: Easing.inOut(Easing.sin) },
      5: { d: 380, ease: Easing.out(Easing.quad), delay: 120 },
      4: { d: 900, ease: Easing.inOut(Easing.sin) },
      3: { d: 1800, ease: Easing.inOut(Easing.sin) },
      2: { d: 70, ease: Easing.linear, delay: 500 },
      1: { d: 2400, ease: Easing.inOut(Easing.sin) },
    };
    const c = cfg[level];
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(p, { toValue: 1, duration: c.d, easing: c.ease, useNativeDriver: ND }),
        Animated.timing(p, { toValue: 0, duration: c.d, easing: c.ease, useNativeDriver: ND }),
        ...(c.delay ? [Animated.delay(c.delay)] : []),
      ]),
    );
    // angry shake: a few quick back-and-forths, then a pause
    const shake = level === 2
      ? Animated.loop(Animated.sequence([
          Animated.loop(Animated.sequence([
            Animated.timing(p, { toValue: 1, duration: 60, useNativeDriver: ND }),
            Animated.timing(p, { toValue: 0, duration: 60, useNativeDriver: ND }),
          ]), { iterations: 5 }),
          Animated.delay(900),
        ]))
      : null;
    (shake ?? loop).start();
    return () => { (shake ?? loop).stop(); };
  }, [level, p]);

  useEffect(() => {
    // Divi keeps moving: wander left and right, flap the flippers (speed and size depend on the mood)
    const WD: Record<MoodLevel, number> = { 6: 2600, 5: 1500, 4: 2000, 3: 3800, 2: 900, 1: 4600 };
    const FD: Record<MoodLevel, number> = { 6: 700, 5: 220, 4: 420, 3: 1800, 2: 110, 1: 2600 };
    w.setValue(0); f.setValue(0);
    const wl = Animated.loop(Animated.sequence([
      Animated.timing(w, { toValue: 1, duration: WD[level], easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(w, { toValue: 0, duration: WD[level], easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    const fl = Animated.loop(Animated.sequence([
      Animated.timing(f, { toValue: 1, duration: FD[level], easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(f, { toValue: 0, duration: FD[level], easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    wl.start(); fl.start();
    return () => { wl.stop(); fl.stop(); };
  }, [level, w, f]);

  useEffect(() => {
    if (!pulse) return;
    pop.setValue(0);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1, duration: 140, useNativeDriver: ND }),
      Animated.spring(pop, { toValue: 0, friction: 4, useNativeDriver: ND }),
    ]).start();
  }, [pulse, pop]);

  const m = (out: number[]) => p.interpolate({ inputRange: [0, 1], outputRange: out });
  const style = {
    6: { translateY: m([0, -6]), rotate: m([-6, 6]), scaleY: m([0.99, 1.02]), scaleX: m([1.01, 0.99]) },
    5: { translateY: m([0, -26]), rotate: m([-4, 4]), scaleY: m([0.96, 1.04]), scaleX: m([1.03, 0.97]) },
    4: { translateY: m([0, -8]), rotate: m([-3, 3]), scaleY: m([1, 1]), scaleX: m([1, 1]) },
    3: { translateY: m([0, 0]), rotate: m([0, 0]), scaleY: m([1, 1.03]), scaleX: m([1, 1.01]) },
    2: { translateY: m([0, 0]), rotate: m([-2.5, 2.5]), scaleY: m([1, 1]), scaleX: m([1, 1]) },
    1: { translateY: m([0, 8]), rotate: m([-1, 1]), scaleY: m([1, 0.97]), scaleX: m([1, 1.01]) },
  }[level];
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const REACH: Record<MoodLevel, number> = { 6: 36, 5: 62, 4: 50, 3: 28, 2: 0, 1: 14 };
  const FLAP: Record<MoodLevel, [number, number]> = { 6: [-6, 22], 5: [-8, 48], 4: [-4, 26], 3: [0, 5], 2: [0, 10], 1: [6, 0] };
  const tx = w.interpolate({ inputRange: [0, 1], outputRange: [-REACH[level], REACH[level]] });
  const ang = f.interpolate({ inputRange: [0, 1], outputRange: [`${FLAP[level][0]}deg`, `${FLAP[level][1]}deg`] });
  const angR = f.interpolate({ inputRange: [0, 1], outputRange: [`${-FLAP[level][0]}deg`, `${-FLAP[level][1]}deg`] });
  const c = size / 2;
  const pivot = (px: number, py: number, rot: Animated.AnimatedInterpolation<string>) => [
    { translateX: (px / 300) * size - c }, { translateY: (py / 300) * size - c }, { rotate: rot },
    { translateX: c - (px / 300) * size }, { translateY: c - (py / 300) * size },
  ];

  return (
    <Animated.View
      style={{
        transform: [
          { translateX: tx },
          { translateY: style.translateY },
          { rotate: style.rotate.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) },
          { scaleX: style.scaleX },
          { scaleY: style.scaleY },
          { scale: popScale },
        ],
      }}
    >
      <Animated.View style={{ position: 'absolute', transform: pivot(52, 170, ang) }} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 300 300"><Path d={FLIP_L} fill={NAVY} /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: pivot(248, 170, angR) }} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 300 300"><Path d={FLIP_R} fill={NAVY} /></Svg>
      </Animated.View>
      <PenguinArt level={level} size={size} flippers={false} />
    </Animated.View>
  );
}
