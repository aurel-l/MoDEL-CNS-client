import React, { memo, useState, useCallback } from 'react';
import screenfull from 'screenfull';

import { IconButton, Popover, Paper } from '@material-ui/core';
import { Flip } from '@material-ui/icons';
import { Slider as MaterialSlider } from '@material-ui/lab';

import style from './style.module.css';

const Slider = memo(({ value, label, handleChange, ...buttonProps }) => {
  // useState
  const [element, setElement] = useState(null);

  return (
    <>
      <IconButton
        {...buttonProps}
        onClick={useCallback(
          ({ currentTarget }) => setElement(currentTarget),
          [],
        )}
      >
        <Flip />
      </IconButton>
      <Popover
        open={!!element}
        anchorEl={element}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        data-popover
        container={screenfull.element || document.body}
        onClose={useCallback(() => setElement(null), [])}
      >
        <Paper className={style['popover-paper']}>
          {label && <span>Membrane opacity:</span>}
          <MaterialSlider
            value={value}
            onChange={handleChange}
            className={style['popover-slider']}
          />
        </Paper>
      </Popover>
    </>
  );
});

export default Slider;