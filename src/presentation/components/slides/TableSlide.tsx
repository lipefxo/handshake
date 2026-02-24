import { motion } from 'motion/react';
import type { TableSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { fadeUpChild, staggerContainer } from '../../../shared/utils/animations';
import { RichText } from '../../../shared/components/RichText';

interface TableSlideProps {
  content: TableSlideContent;
}

export function TableSlide({ content }: TableSlideProps) {
  const hasDenseLayout = content.columns.length >= 5 || content.rows.length >= 8;
  const cellPaddingClass = hasDenseLayout ? 'px-2 py-1.5' : 'px-3 py-2';
  const cellTextClass = hasDenseLayout ? 'text-xs' : 'text-sm';

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-4 md:px-8 py-8 md:py-12 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={520} className="top-0 right-0 translate-x-1/4 -translate-y-1/4" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div variants={fadeUpChild} className="mb-6 text-center md:text-left">
          <h2
            className="text-3xl md:text-4xl"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
          >
            <RichText text={content.heading} />
          </h2>
          {content.description && (
            <p
              className="mt-2 text-sm md:text-base"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              <RichText text={content.description} />
            </p>
          )}
        </motion.div>

        <div className="w-full overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-border-default)' }}>
          <table className="w-full min-w-[600px] table-fixed border-collapse">
            <thead style={{ background: 'var(--color-bg-secondary)' }}>
              <tr>
                {content.columns.map((column, index) => (
                  <th
                    key={`${column}-${index}`}
                    className={`${cellPaddingClass} ${cellTextClass} text-left font-semibold truncate`}
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-body)',
                      borderBottom: '1px solid var(--color-border-default)',
                    }}
                    title={column}
                  >
                    <RichText text={column} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row, rowIndex) => (
                <motion.tr
                  key={`row-${rowIndex}`}
                  variants={fadeUpChild}
                  style={{
                    background: rowIndex % 2 === 0 ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                  }}
                >
                  {content.columns.map((_, colIndex) => (
                    <td
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={`${cellPaddingClass} ${cellTextClass} truncate align-top`}
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-body)',
                        borderTop: rowIndex === 0 ? 'none' : '1px solid var(--color-border-default)',
                      }}
                      title={row[colIndex] ?? ''}
                    >
                      <RichText text={row[colIndex] ?? ''} />
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
