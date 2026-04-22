import type { LogLines } from '../statsCalculations';
import './StatsPopupContent.css';

interface StatsPopupContentProps {
	stats: LogLines;
}

export default function StatsPopupContent({ stats }: StatsPopupContentProps) {
	return (
		<div className="layout">
			{stats.map((section, index) => {
				return (
					<div key={index} className="section">
						{section.map((line, lineIndex) => {
							const classes = [];
							if (line.bold) classes.push('bold');
							classes.push('stat-align-' + line.align);
							const classNames = classes.join(' ');
							return (
								<div className={classNames} key={lineIndex}>{line.text}</div>
							)
						})}
					</div>
				);
			})}
		</div>
	);
}