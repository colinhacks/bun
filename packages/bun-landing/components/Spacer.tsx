export function Spacer(props: {w?: string; h?: string; f?: string}) {
  return <div style={{width: props.w, height: props.h, flex: props.f}}></div>;
}
