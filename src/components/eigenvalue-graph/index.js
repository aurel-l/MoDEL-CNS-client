import React, { useRef, useEffect } from 'react';
import { noop } from 'lodash-es';
import {
  select,
  scaleLinear,
  scaleBand,
  line,
  area,
  axisBottom,
  axisLeft,
  axisRight,
  event,
} from 'd3';

import style from './style.module.css';

const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };
const MIN_DISPLAY_INDEX = 14; // display at least 14 components
const MIN_DISPLAY_EXPL = 0.8; // display at least components for 80% explanation

const EigenvalueGraph = ({
  data,
  totalEigenvalue,
  projections,
  setProjections,
}) => {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const drawRef = useRef(noop);
  const processedRef = useRef(null);
  const projectionsRef = useRef(projections);

  // should only be run once
  useEffect(() => {
    const graph = select(containerRef.current).append('svg');

    const refs = {
      xAxis: graph.append('g').attr('class', style.axis),
      yExplAxis: graph.append('g').attr('class', style.axis),
      yEigenAxis: graph.append('g').attr('class', style.axis),
      barLegend: graph.append('g').attr('class', style['bar-legend']),
      explanationArea: graph.append('g').attr('class', style.explanation),
      visualBars: graph
        .append('g')
        .attr('class', `${style.visual} ${style.bars}`),
      targetBars: graph
        .append('g')
        .attr('class', `${style.target} ${style.bars}`),
    };

    drawRef.current = ({
      processed = processedRef.current,
      projections = projectionsRef.current,
    } = {}) => {
      // container size
      const { clientWidth: width, clientHeight: height } = containerRef.current;
      graph.attr('width', width).attr('height', height);

      // x axis
      const x = scaleBand()
        .domain(processed.map((_, i) => i))
        .range([MARGIN.left, width - MARGIN.right])
        .padding(0.1);

      // visual x axis
      const xAxis = g =>
        g
          .attr('transform', `translate(0, ${height - MARGIN.bottom})`)
          .call(axisBottom(x).tickFormat(d => d + 1));
      refs.xAxis.call(xAxis);

      // explained variance
      // y axis
      const yExpl = scaleLinear()
        .domain([0, 1])
        .range([height - MARGIN.bottom, MARGIN.top])
        .nice();

      // visual y axis
      const yExplAxis = g =>
        g.attr('transform', `translate(${width - MARGIN.right}, 0)`).call(
          axisRight(yExpl)
            .tickFormat(d => `${d * 100}%`)
            .ticks(11),
        );
      refs.yExplAxis.call(yExplAxis);

      // lines
      const lineFn = line()
        .x((_, i) => x(i) + x.bandwidth() / 2)
        .y(yExpl);

      const explLine = refs.explanationArea
        .selectAll(`path.${style['top-line']}`)
        .data([processed]);
      explLine
        .enter()
        .append('path')
        .attr('class', style['top-line'])
        .attr('opacity', 0)
        .merge(explLine)
        .attr('d', d => lineFn(d.map(item => item.cumulativeExplained)))
        .transition()
        .duration(2000)
        .attr('opacity', 1);

      // areas
      const areaFn = area()
        .x((_, i) => x(i) + x.bandwidth() / 2)
        .y0(height - MARGIN.bottom)
        .y1(d => yExpl(d));

      const explArea = refs.explanationArea
        .selectAll(`path.${style.area}`)
        .data([processed]);
      explArea
        .enter()
        .append('path')
        .attr('class', style.area)
        .attr('opacity', 0)
        .merge(explArea)
        .attr('d', d => areaFn(d.map(item => item.cumulativeExplained)))
        .transition()
        .duration(2000)
        .attr('opacity', 1);

      // eigenvalue
      // y axis
      const yEigen = scaleLinear()
        .domain([0, data['component-1'].eigenvalue])
        .range([height - MARGIN.bottom, MARGIN.top])
        .nice();

      // visual y axis
      const yEigenAxis = g =>
        g
          .attr('transform', `translate(${MARGIN.left}, 0)`)
          .call(axisLeft(yEigen).ticks(11));
      refs.yEigenAxis.call(yEigenAxis);

      // bars
      const bars = refs.visualBars.selectAll('rect').data(processed);
      bars
        .enter()
        .append('rect')
        .attr('y', yEigen(0))
        .attr('height', 0)
        .merge(bars)
        .attr(
          'class',
          ({ hasProjection, projected }) =>
            `${hasProjection ? style['has-projection'] : ''} ${
              projected ? style.projected : ''
            }`.trim() || null,
        )
        .attr('x', (_, i) => x(i))
        .attr('width', x.bandwidth())
        .transition()
        .delay((_, i) => i * 50)
        .attr('y', d => yEigen(d.eigenvalue))
        .attr('height', d => height - MARGIN.bottom - yEigen(d.eigenvalue));
      // full-height bars (for click and hover handlers)
      const clickBars = refs.targetBars.selectAll('rect').data(processed);
      const clickBarsEnter = clickBars
        .enter()
        .append('rect')
        .on('click', ({ hasProjection }, i) => {
          if (!hasProjection) return;
          setProjections(([one, two]) => (i === two ? [two, one] : [two, i]));
        })
        .on('mousemove', (d, i) => {
          tooltipRef.current.innerHTML = `
          <div>
            <p>Principal component ${i + 1}</p>
            <p>Eigenvalue: ${d.eigenvalue}</p>
            <p>
              Explained variance: ${Math.round(
                (d.eigenvalue / totalEigenvalue) * 1000,
              ) / 10}%
            </p>
            <p>
              Cumulative explained variance: ${Math.round(
                d.cumulativeExplained * 1000,
              ) / 10}%
            </p>
            <p>Projection data is ${d.hasProjection ? '' : 'not'} available</p>
          </div>
          `.trim();
          tooltipRef.current.style.display = 'inline-block';
          const { width, height } = tooltipRef.current.getBoundingClientRect();
          tooltipRef.current.style.transform = `translate(${event.pageX -
            width / 2}px, ${event.pageY - height - 5}px)`;
        })
        .on('mouseout', () => (tooltipRef.current.style.display = 'none'));
      clickBarsEnter
        .merge(clickBars)
        .attr('class', ({ hasProjection }) =>
          hasProjection ? style['has-projection'] : '' || null,
        )
        .attr('x', (_, i) => x(i))
        .attr('width', x.bandwidth())
        .attr('y', MARGIN.top)
        .attr('height', height - MARGIN.top - MARGIN.bottom);
      clickBarsEnter
        .append('title')
        .text(({ hasProjection }) =>
          hasProjection
            ? null
            : 'No projection data available for this component',
        );

      // bar legends
      const barLegends = refs.barLegend.selectAll('text').data(projections);
      barLegends
        .enter()
        .append('text')
        .text((_, i) => (i === 0 ? '↔' : '↕'))
        .merge(barLegends)
        .attr('y', height - 8)
        .transition()
        .attr('x', d => x(d) + x.bandwidth() / 2);
    };

    window.addEventListener('resize', drawRef.current);

    return () => window.removeEventListener('resize', drawRef.current);
  }, []);

  // data massaging
  useEffect(() => {
    let acc = 0;
    const processed = [];
    for (const [index, { eigenvalue, data: projectionData }] of Object.values(
      data,
    ).entries()) {
      acc += eigenvalue;
      const cumulativeExplained = acc / totalEigenvalue;
      processed.push({
        cumulativeExplained,
        eigenvalue,
        projected: projections.includes(index),
        hasProjection: !!projectionData,
      });
      if (
        index >= MIN_DISPLAY_INDEX &&
        cumulativeExplained >= MIN_DISPLAY_EXPL
      ) {
        break;
      }
    }

    processedRef.current = processed;
    projectionsRef.current = projections;

    drawRef.current({ processed, projections });
  }, [data, totalEigenvalue, projections]);

  const components = Object.values(data);

  return (
    <>
      <div className={style['graph-container']} ref={containerRef} />
      <div className={style['info-box']}>
        <div>
          <p>
            First selected projection:
            <br />
            principal component {projections[0] + 1}
          </p>
          <p>
            Eigenvalue: {components[projections[0]].eigenvalue}
            <br />
            Explained variance:{' '}
            {Math.round(
              (components[projections[0]].eigenvalue / totalEigenvalue) * 1000,
            ) / 10}
            %
          </p>
        </div>
        <div>
          <p>
            Second selected projection:
            <br />
            principal component {projections[1] + 1}
          </p>
          <p>
            Eigenvalue: {components[projections[1]].eigenvalue}
            <br />
            Explained variance:{' '}
            {Math.round(
              (components[projections[1]].eigenvalue / totalEigenvalue) * 1000,
            ) / 10}
            %
          </p>
        </div>
      </div>
      <div className={style.tooltip} ref={tooltipRef} />
    </>
  );
};

export default EigenvalueGraph;
