import { Text } from '@react-three/drei'

/**
 * BotLabel — Gold unit label displayed below each robot arm.
 */
export default function BotLabel({ label }) {
  return (
    <Text
      position={[0, -0.3, 1.5]}
      fontSize={0.35}
      color="#c9a84c"
      anchorX="center"
      anchorY="middle"
      letterSpacing={0.15}
    >
      {label}
    </Text>
  )
}
