import { Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, lineLimit } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type Props = { who: string; emoji: string; mood: string; tip: string };

// Runs in an isolated runtime: no hooks, no outside constants. Data comes from the app via updateTimeline.
const MoodWidget = (props: Props, environment: WidgetEnvironment) => {
  'widget';
  const fam = environment.widgetFamily;
  if (fam === 'accessoryInline') {
    return <Text>{`${props.emoji} ${props.who}: ${props.mood}`}</Text>;
  }
  if (fam === 'accessoryCircular') {
    return (
      <VStack spacing={0}>
        <Text modifiers={[font({ size: 26 })]}>{props.emoji}</Text>
        <Text modifiers={[font({ size: 9, weight: 'bold' }), lineLimit(1)]}>{props.who}</Text>
      </VStack>
    );
  }
  if (fam === 'accessoryRectangular') {
    return (
      <VStack spacing={1}>
        <Text modifiers={[font({ size: 13, weight: 'bold' }), lineLimit(1)]}>{`${props.emoji} ${props.who}: ${props.mood}`}</Text>
        <Text modifiers={[font({ size: 11 }), lineLimit(2)]}>{props.tip}</Text>
      </VStack>
    );
  }
  const small = fam === 'systemSmall';
  return (
    <VStack spacing={4} modifiers={[containerBackground('#FFF1F5', 'widget')]}>
      <Text modifiers={[font({ size: small ? 34 : 44 })]}>{props.emoji}</Text>
      <Text modifiers={[font({ weight: 'heavy', size: 15 }), foregroundStyle('#3B2A33')]}>{props.mood}</Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle('#8A7480')]}>{small ? props.who : `${props.who}: ${props.tip}`}</Text>
    </VStack>
  );
};

export default createWidget('MoodWidget', MoodWidget, { who: 'Divi', emoji: '🐧', mood: 'Open Divi Mood', tip: '' });
