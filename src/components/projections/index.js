import React, { useRef, useEffect } from 'react';
import { noop, zip, random } from 'lodash-es';
import {
  select,
  scaleLinear,
  axisLeft,
  axisBottom,
  scaleSequential,
  interpolateViridis,
  rgb,
  easeElastic,
  easeCubicInOut,
  interpolate,
  timer,
  voronoi,
  event,
  brush,
} from 'd3';

import style from './style.module.css';

const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 };

// device pixel ratio (for "retina" screens)
const dPR = window.devicePixelRatio || 1;

// animation constants
const maxDelay = 500;
const [minDuration, maxDuration] = [375, 625];

// easing for start animation (looks like a spring coming out of the centre)
const customElastic = easeElastic.amplitude(1).period(0.5);

const drawPoint = ({ context, x, y, radius, fill }) => {
  context.fillStyle = fill;
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fill();
};

// timer instance variable
let t;

const movePoints = ({
  context,
  dataPoints,
  width,
  height,
  maxTime,
  firstTime,
  radius,
}) => {
  if (t) t.stop();
  t = timer(elapsed => {
    context.fillStyle = 'rgba(255, 255, 255, 0.25)';
    context.fillRect(0, 0, width * dPR, height * dPR);
    if (elapsed >= maxTime) {
      t.stop();
      context.clearRect(0, 0, width, height);
    }
    for (const dataPoint of dataPoints) {
      const easedProgress = Math.max(
        0,
        (firstTime ? customElastic : easeCubicInOut)(
          Math.min((elapsed - dataPoint.delay) / dataPoint.duration, 1),
        ),
      );
      dataPoint.currentX = dataPoint.interpolateX(easedProgress);
      dataPoint.currentY = dataPoint.interpolateY(easedProgress);
      // skip out-of-screen points
      if (
        dataPoint.currentX < 0 ||
        dataPoint.currentX > width ||
        dataPoint.currentY < 0 ||
        dataPoint.currentY > height
      ) {
        continue;
      }
      const point = {
        context,
        x: dataPoint.currentX,
        y: dataPoint.currentY,
        radius,
        fill: dataPoint.fill,
      };
      drawPoint(point);
    }
  });
};

const Projections = ({ data, projections, step, setSelected }) => {
  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const drawRef = useRef(noop);
  const dataPointsRef = useRef(null);
  const processedRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const canvas = select(containerRef.current).append('canvas');
    const graph = select(containerRef.current).append('svg');

    const context = canvas.node().getContext('2d');

    const brushInstance = brush();

    const refs = {
      xScale: scaleLinear(),
      yScale: scaleLinear(),
      xAxis: graph.append('g').attr('class', style.axis),
      yAxis: graph.append('g').attr('class', style.axis),
      dataPoints: graph.append('g').attr('class', style['data-points']),
      hover: graph.append('circle').attr('fill', 'transparent'),
      legendCanvas: select(legendRef.current).select('canvas'),
      legendCursor: select(legendRef.current).select(`.${style.cursor}`),
      brush: brushInstance,
      brushElement: graph.append('g').attr('class', 'brush'),
    };

    const reset = () => {
      tooltipRef.current.style.display = 'none';
      refs.hover.attr('fill', 'transparent');
      refs.legendCursor.style('left', '');
      refs.legendCursor.style('opacity', 0);
    };

    const handleClick = ({ datumIndex } = {}) =>
      setSelected(selected => {
        const target = datumIndex * step;
        return target === selected ? null : target;
      });

    drawRef.current = ({ processed = processedRef.current, brushing } = {}) => {
      if (!processed) return;
      // container size
      const { clientWidth: width, clientHeight: height } = containerRef.current;
      graph.attr('width', width).attr('height', height);
      canvas.attr('width', width * dPR).attr('height', height * dPR);
      canvas.style('width', `${width}px`).style('height', `${height}px`);

      refs.brushElement.call(refs.brush);

      const isFirstTime = !dataPointsRef.current;

      // x axis
      refs.xScale.range([MARGIN.left, width - MARGIN.right]);
      if (!brushing) refs.xScale.domain(processed.xMinMax);

      // y axis
      refs.yScale.range([height - MARGIN.bottom, MARGIN.top]);
      if (!brushing) refs.yScale.domain(processed.yMinMax);

      // visual x axis
      const xAxis = g =>
        g
          .attr(
            'transform',
            `translate(0, ${Math.min(
              Math.max(0, refs.yScale(0)),
              height - 20,
            )})`,
          )
          .call(
            axisBottom(refs.xScale)
              .ticks(Math.round(width / 75))
              .tickFormat(d => (d === 0 ? null : d)),
          );
      refs.xAxis
        .transition()
        .duration(!isFirstTime && maxDelay + maxDuration)
        .call(xAxis);

      // visual y axis
      const yAxis = g =>
        g
          .attr(
            'transform',
            `translate(${Math.min(
              Math.max(30, refs.xScale(0)),
              width - 1,
            )}, 0)`,
          )
          .call(
            axisLeft(refs.yScale)
              .ticks(Math.round(height / 75))
              .tickFormat(d => (d === 0 ? null : d)),
          );
      refs.yAxis
        .transition()
        .duration(!isFirstTime && maxDelay + maxDuration)
        .call(yAxis);

      refs.brush.on('end', () => {
        const { selection } = event;
        if (!selection) return;
        refs.xScale.domain(
          [selection[0][0], selection[1][0]].map(
            refs.xScale.invert,
            refs.xScale,
          ),
        );
        refs.yScale.domain(
          [selection[1][1], selection[0][1]].map(
            refs.yScale.invert,
            refs.yScale,
          ),
        );
        // remove visual brush rectangle
        refs.brushElement.call(refs.brush.move, null);
        drawRef.current({ brushing: true });
      });

      const radius = (dPR * Math.min(width, height)) / 250;
      // hover circle
      refs.hover.attr('r', radius * 5);

      // data points
      let maxTime = 0;
      dataPointsRef.current = processed.data.map(
        ({ x: xValue, y: yValue, fill }, i, { length }) => {
          const xPoint = refs.xScale(xValue) * dPR;
          const yPoint = refs.yScale(yValue) * dPR;
          const delay = (i * maxDelay * (isFirstTime ? 3 : 1)) / length;
          const duration =
            random(minDuration, maxDuration) * (isFirstTime ? 3 : 1);
          const time = delay + duration;
          if (maxTime < time) maxTime = time;
          return {
            currentX: null,
            currentY: null,
            interpolateX: interpolate(
              isFirstTime
                ? refs.xScale(0) * dPR
                : dataPointsRef.current[i].currentX ||
                    dataPointsRef.current[i].x,
              xPoint,
            ),
            interpolateY: interpolate(
              isFirstTime
                ? refs.yScale(0) * dPR
                : dataPointsRef.current[i].currentY ||
                    dataPointsRef.current[i].y,
              yPoint,
            ),
            delay,
            duration,
            x: xPoint,
            y: yPoint,
            fill,
          };
        },
      );

      movePoints({
        context,
        dataPoints: dataPointsRef.current,
        width,
        height,
        maxTime,
        firstTime: isFirstTime,
        radius,
      });

      // voronoi diagram (to detect closest points to mouse)
      const voronoiDiagram = voronoi()
        .x(d => refs.xScale(d.x))
        .y(d => refs.yScale(d.y))
        .size([width, height])(processed.data);

      const handleHover = ({ datumIndex, datum } = {}) => {
        if (!datumIndex) return;
        const { scrollX, scrollY } = window;
        const { left, top } = containerRef.current.getBoundingClientRect();
        tooltipRef.current.innerHTML = `
          <div>
            <p>Frame ${datumIndex * processed.step + 1}</p>
            <p>Principal component ${processed.projections[0] + 1}: ${
          datum.x
        }</p>
            <p>Principal component ${processed.projections[1] + 1}: ${
          datum.y
        }</p>
          </div>
        `.trim();
        tooltipRef.current.style.display = 'inline-block';
        const { width, height } = tooltipRef.current.getBoundingClientRect();
        tooltipRef.current.style.transform = `translate(${refs.xScale(datum.x) +
          left +
          scrollX -
          width / 2}px, ${refs.yScale(datum.y) +
          top +
          scrollY -
          height -
          15}px)`;
        refs.hover
          .attr('cx', refs.xScale(datum.x))
          .attr('cy', refs.yScale(datum.y))
          .attr('fill', datum.fill);
        refs.legendCursor.style(
          'left',
          `calc(${(100 * datumIndex) / processed.data.length}% - 4px)`,
        );
        refs.legendCursor.style('opacity', 1);
      };

      const handleGraphEventWith = handler => () => {
        const { scrollX, scrollY } = window;
        const { left, top } = containerRef.current.getBoundingClientRect();
        const { pageX, pageY } = event;
        const point = voronoiDiagram.find(
          // x
          pageX - left - scrollX,
          // y
          pageY - top - scrollY,
          // threshold
          20,
        );
        if (point) {
          const datumIndex = processed.data.findIndex(
            datum => datum === point.data,
          );
          handler({ datumIndex, datum: point.data });
        } else {
          reset();
          handler();
        }
      };

      graph
        .on('mousemove', handleGraphEventWith(handleHover))
        .on('mouseout', reset)
        .on('click', handleGraphEventWith(handleClick));

      const handleLegendEventWith = handler => () => {
        const {
          left,
          width,
        } = refs.legendCanvas.node().getBoundingClientRect();
        const { pageX } = event;
        const position = (pageX - left) / width;
        const datumIndex = Math.floor(position * processed.data.length);
        handler({ datumIndex, datum: processed.data[datumIndex] });
      };

      refs.legendCanvas
        .on('mousemove', handleLegendEventWith(handleHover))
        .on('mouseout', reset)
        .on('click', handleLegendEventWith(handleClick));
    };

    window.addEventListener('resize', drawRef.current);

    return () => window.removeEventListener('resize', drawRef.current);
  }, []);

  useEffect(() => {
    const values = Object.values(data);

    // colour scale
    const colorScale = scaleSequential(interpolateViridis).domain([
      0,
      values[0].data.length,
    ]);

    // legend scale
    const legendContext = legendRef.current.children[0].getContext('2d');
    const legendImage = legendContext.createImageData(200, 1);

    const legendScale = scaleLinear()
      .range([0, 199])
      .domain(colorScale.domain());
    for (let i = 0; i < 200; i++) {
      const color = rgb(colorScale(legendScale.invert(i)));
      legendImage.data[4 * i] = color.r;
      legendImage.data[4 * i + 1] = color.g;
      legendImage.data[4 * i + 2] = color.b;
      legendImage.data[4 * i + 3] = 255;
    }
    legendContext.putImageData(legendImage, 0, 0);
    const processed = {
      data: zip(values[projections[0]].data, values[projections[1]].data).map(
        ([x, y], i) => ({ x, y, fill: colorScale(i) }),
      ),
      xMinMax: [values[projections[0]].min, values[projections[0]].max],
      yMinMax: [values[projections[1]].min, values[projections[1]].max],
      step,
      projections,
    };

    processedRef.current = processed;

    drawRef.current({ processed });
  }, [data, projections, step]);

  return (
    <>
      <div
        className={style['graph-container']}
        onDoubleClick={drawRef.current}
        ref={containerRef}
      />
      <div className={style.legend}>
        <p>position in simulation:</p>
        <div className={style['color-scale']}>
          <div>start</div>
          <div ref={legendRef}>
            <canvas height="1" width="200" />
            <div className={style.cursor} />
          </div>
          <div>end</div>
        </div>
      </div>
      <div className={style.tooltip} ref={tooltipRef} />
    </>
  );
};

export default Projections;