import { useState } from 'react'
import clsx from 'clsx'
import Layout from '@theme/Layout'
import JsonLd from '@site/src/components/JsonLd'
import HeroCTA from '@site/src/components/HeroCTA'
import ThreeJsScene from '@site/src/components/Annimations/SphereScene'
import { Clock, TrendingUp, DollarSign, Calendar, Download, Share2, Check } from 'lucide-react'

import styles from './roi-calculator.module.css'

const LayoutComponent: any = Layout

const DEFAULT_TASKS = [
    { id: 1, name: 'Preparing emails (status updates, reports)', minutesPerWeek: 120, enabled: true },
    { id: 2, name: 'Preparing status update decks (PowerPoint, slides)', minutesPerWeek: 180, enabled: true },
    { id: 3, name: 'Logging 1:1s (meeting notes, action items)', minutesPerWeek: 90, enabled: true },
    { id: 4, name: 'Updating Jira tickets (status, comments, estimates)', minutesPerWeek: 150, enabled: true },
    { id: 5, name: 'Preparing reports (weekly, monthly summaries)', minutesPerWeek: 240, enabled: true },
    { id: 6, name: 'Attending status meetings (that could be automated)', minutesPerWeek: 180, enabled: true },
    { id: 7, name: 'Manual data entry (copying between systems)', minutesPerWeek: 120, enabled: true }
]

function ROIHero() {
    return (
        <header className={clsx('hero hero--primary', styles.heroSection)}>
            <div className={styles.heroBackground}>
                <ThreeJsScene className={styles.threeJsCanvas} />
            </div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Do you really consider this your job?</h1>
                <p className={styles.heroSubtitle}>Calculate how much time AnswerAgent could save your team</p>
            </div>
        </header>
    )
}

function CalculatorSection() {
    const [tasks, setTasks] = useState(DEFAULT_TASKS)
    const [teamSize, setTeamSize] = useState(10)
    const [hourlyRate, setHourlyRate] = useState(75)
    const [showResults, setShowResults] = useState(false)

    const updateTask = (id: number, field: string, value: any) => {
        setTasks(tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task)))
    }

    const addCustomTask = () => {
        const newId = Math.max(...tasks.map((t) => t.id)) + 1
        setTasks([...tasks, { id: newId, name: 'Custom Task', minutesPerWeek: 60, enabled: true }])
    }

    const removeTask = (id: number) => {
        setTasks(tasks.filter((task) => task.id !== id))
    }

    const totalMinutesPerWeek = tasks.reduce((sum, task) => (task.enabled ? sum + task.minutesPerWeek : sum), 0)
    const hoursPerWeek = totalMinutesPerWeek / 60
    const hoursPerYear = hoursPerWeek * 52
    const daysPerYear = hoursPerYear / 8
    const weeksPerYear = daysPerYear / 5

    const teamTotalHours = hoursPerWeek * teamSize
    const teamTotalDays = teamTotalHours / 8
    const teamAnnualHours = hoursPerYear * teamSize
    const _teamAnnualDays = teamAnnualHours / 8

    const costPerYear = hoursPerYear * hourlyRate
    const teamCostPerYear = costPerYear * teamSize

    const calculateResults = () => {
        setShowResults(true)
    }

    return (
        <section className={styles.calculatorSection}>
            <div className='container'>
                <div className={styles.introMessage}>
                    <h2>You were hired to:</h2>
                    <ul className={styles.hiredList}>
                        <li>
                            <Check size={20} />
                            Be creative
                        </li>
                        <li>
                            <Check size={20} />
                            Engineer solutions
                        </li>
                        <li>
                            <Check size={20} />
                            Market products
                        </li>
                        <li>
                            <Check size={20} />
                            Close deals
                        </li>
                        <li>
                            <Check size={20} />
                            Support customers
                        </li>
                    </ul>

                    <h2 style={{ marginTop: '2rem' }}>You were NOT hired to:</h2>
                    <ul className={styles.notHiredList}>
                        <li>Copy-paste between Jira and Slack</li>
                        <li>Spend 2 hours making a status deck</li>
                        <li>Type the same update into 4 different systems</li>
                        <li>Attend meetings that could&apos;ve been an AI summary</li>
                    </ul>

                    <p className={styles.callout}>Look at how much time this administrative work takes from your week.</p>
                    <p className={styles.callout}>
                        <strong>Now imagine what you could do with that time back.</strong>
                    </p>
                </div>

                <div className='row'>
                    <div className='col col--7'>
                        <div className={styles.calculatorCard}>
                            <h3>Time Spent on Administrative Tasks</h3>
                            <p className={styles.cardSubtext}>
                                Adjust the minutes per week you spend on each task, or add your own custom tasks.
                            </p>

                            <div className={styles.tasksList}>
                                {tasks.map((task) => (
                                    <div key={task.id} className={styles.taskRow}>
                                        <input
                                            type='checkbox'
                                            checked={task.enabled}
                                            onChange={(e) => updateTask(task.id, 'enabled', e.target.checked)}
                                            className={styles.taskCheckbox}
                                        />
                                        <input
                                            type='text'
                                            value={task.name}
                                            onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                                            className={styles.taskNameInput}
                                            disabled={!task.enabled}
                                        />
                                        <input
                                            type='number'
                                            value={task.minutesPerWeek}
                                            onChange={(e) => updateTask(task.id, 'minutesPerWeek', parseInt(e.target.value) || 0)}
                                            className={styles.taskMinutesInput}
                                            disabled={!task.enabled}
                                            min='0'
                                        />
                                        <span className={styles.minutesLabel}>min/week</span>
                                        <button onClick={() => removeTask(task.id)} className={styles.removeButton} title='Remove task'>
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button onClick={addCustomTask} className='button button--secondary button--sm' style={{ marginTop: '1rem' }}>
                                + Add Custom Task
                            </button>

                            <div className={styles.teamSettings}>
                                <div className={styles.settingRow}>
                                    <label htmlFor='teamSize'>Team Size:</label>
                                    <input
                                        id='teamSize'
                                        type='number'
                                        value={teamSize}
                                        onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                                        className={styles.settingInput}
                                        min='1'
                                    />
                                    <span>people</span>
                                </div>
                                <div className={styles.settingRow}>
                                    <label htmlFor='hourlyRate'>Average Hourly Rate:</label>
                                    <span>$</span>
                                    <input
                                        id='hourlyRate'
                                        type='number'
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                                        className={styles.settingInput}
                                        min='0'
                                    />
                                    <span>/hour</span>
                                </div>
                            </div>

                            <button
                                onClick={calculateResults}
                                className='button button--primary button--lg button--block'
                                style={{ marginTop: '2rem' }}
                            >
                                Calculate Time Savings
                            </button>
                        </div>
                    </div>

                    <div className='col col--5'>
                        <div className={clsx(styles.resultsCard, showResults && styles.visible)}>
                            <h3>Your Time Savings</h3>

                            <div className={styles.resultSection}>
                                <div className={styles.resultIcon}>
                                    <Clock size={32} />
                                </div>
                                <div>
                                    <div className={styles.resultLabel}>Per Person, Per Week</div>
                                    <div className={styles.resultValue}>{hoursPerWeek.toFixed(1)} hours</div>
                                    <div className={styles.resultSubtext}>({((hoursPerWeek / 40) * 100).toFixed(0)}% of work week)</div>
                                </div>
                            </div>

                            <div className={styles.resultSection}>
                                <div className={styles.resultIcon}>
                                    <TrendingUp size={32} />
                                </div>
                                <div>
                                    <div className={styles.resultLabel}>Team ({teamSize} people), Per Week</div>
                                    <div className={styles.resultValue}>{teamTotalHours.toFixed(1)} hours</div>
                                    <div className={styles.resultSubtext}>({teamTotalDays.toFixed(1)} work days)</div>
                                </div>
                            </div>

                            <div className={styles.resultSection}>
                                <div className={styles.resultIcon}>
                                    <Calendar size={32} />
                                </div>
                                <div>
                                    <div className={styles.resultLabel}>Per Person, Per Year</div>
                                    <div className={styles.resultValue}>{daysPerYear.toFixed(0)} days</div>
                                    <div className={styles.resultSubtext}>({weeksPerYear.toFixed(1)} work weeks)</div>
                                </div>
                            </div>

                            <div className={styles.resultSection}>
                                <div className={styles.resultIcon}>
                                    <DollarSign size={32} />
                                </div>
                                <div>
                                    <div className={styles.resultLabel}>Team Cost Savings, Per Year</div>
                                    <div className={styles.resultValue}>${teamCostPerYear.toLocaleString()}</div>
                                    <div className={styles.resultSubtext}>Based on ${hourlyRate}/hour average rate</div>
                                </div>
                            </div>

                            <div className={styles.resultActions}>
                                <button className='button button--secondary button--sm'>
                                    <Download size={16} style={{ marginRight: '0.5rem' }} />
                                    Download PDF
                                </button>
                                <button className='button button--secondary button--sm'>
                                    <Share2 size={16} style={{ marginRight: '0.5rem' }} />
                                    Share Results
                                </button>
                            </div>

                            <div className={styles.ctaBox}>
                                <p>
                                    <strong>As a business leader:</strong> Imagine if your team spent more time doing what you hired them
                                    for—and less time on administrative overhead.
                                </p>
                                <a
                                    href='https://calendly.com/lastrev/answeragent-demo'
                                    className='button button--primary button--block'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    Schedule a Demo
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function BottomCTASection() {
    return (
        <section className={styles.bottomCTASection}>
            <div className='container text--center'>
                <h2 style={{ marginBottom: '1rem' }}>Ready to reclaim your time?</h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
                    See how AnswerAgent can transform your team&apos;s productivity
                </p>
                <HeroCTA
                    context={{
                        page: 'roi-calculator',
                        section: 'bottom-cta'
                    }}
                    variant='centered'
                />
            </div>
        </section>
    )
}

export default function ROICalculator(): JSX.Element {
    return (
        <div data-theme='dark'>
            <LayoutComponent title='ROI Calculator' description='Calculate how much time and money AnswerAgent can save your team.'>
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'AnswerAgent ROI Calculator',
                        description: 'Calculate the time and cost savings from automating administrative tasks with AI agents.'
                    }}
                />
                <ROIHero />
                <main>
                    <CalculatorSection />
                    <BottomCTASection />
                </main>
            </LayoutComponent>
        </div>
    )
}
