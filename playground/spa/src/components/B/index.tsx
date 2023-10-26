const B = () => {
  return (
    <div className={'box'}>
      <div id='b_1' className={'text-[16px]'}>
        这是tailwindcss的text-[16px]，转了vw
      </div>
      <div id='b_2' className={'text-[length:16PX]'}>
        这是tailwindcss的text-[length:16PX]，不转vw
      </div>
    </div>
  )
}

export default B
