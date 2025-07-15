import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Textarea,
  Button,
  Tag,
  TagLabel,
  Switch,
  Center,
  Icon,
  Flex,
  Divider,
  Tooltip,
  Grid,
  GridItem,
  useColorModeValue,
  useColorMode,
  RadioGroup,
  Radio,
  Stack,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { FiUploadCloud, FiRefreshCw } from 'react-icons/fi';
import { matcherService } from '../services/matcherService';
import { documentService } from '../services/documentService';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LoadingSpinner from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

const SKILL_COLORS = {
  'Hard Skill': 'teal',
  'Soft Skill': 'orange',
  'Core': 'purple',
  'Emphasis': 'yellow',
};

// Add a palette of brand/primary colors for alternating tags and graph
const TAG_COLOR_PALETTE = [
  'teal', 'blue', 'purple', 'orange', 'pink', 'red', 'cyan', 'green', 'yellow', 'facebook', 'messenger', 'linkedin', 'twitter'
];

const MatcherPage = () => {
    
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const fileInputRef = useRef(null);
  const [resumeSource, setResumeSource] = useState('current'); // 'current' or 'upload'
  const [currentDoc, setCurrentDoc] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [expandedGuides, setExpandedGuides] = useState(new Set());
  const exportRef = useRef();

  // Color mode aware values
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const gridBg = useColorModeValue('whiteAlpha.700', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardShadow = useColorModeValue('0 2px 12px 0 rgba(31, 38, 135, 0.08)', '0 2px 12px 0 rgba(0,0,0,0.48)');
  const borderRadius = '14px';
  const headingColor = useColorModeValue('#1A202C', 'gray.100');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');
  const tagBg = useColorModeValue('gray.50', 'gray.600');
  const tagText = useColorModeValue('#1A202C', 'gray.100');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const textareaBg = useColorModeValue('var(--color-bg-alt)', '#23272f');
  const textareaText = useColorModeValue('gray.800', 'gray.100');
  const textareaPlaceholder = useColorModeValue('gray.400', 'gray.400');
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (resumeSource === 'current') {
      setDocLoading(true);
      documentService.getDocuments().then(docs => {
        setCurrentDoc(docs && docs.length > 0 ? docs[0] : null);
        setDocLoading(false);
      }).catch(() => {
        setCurrentDoc(null);
        setDocLoading(false);
      });
    }
  }, [resumeSource]);

  // On result change, save to localStorage
  useEffect(() => {
    if (result) {
      localStorage.setItem('matcherResult', JSON.stringify(result));
    }
  }, [result]);

  // On mount, load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('matcherResult');
    if (saved) {
      setResult(JSON.parse(saved));
    }
  }, []);

  const handleMatch = async (forceReanalyze = false) => {
    let resumeInput;
    if (resumeSource === 'current') {
      if (!currentDoc || !currentDoc.content) {
        setError('No current document found. Please upload a document first.');
        return;
      }
      resumeInput = currentDoc.content;
    } else {
      if (!resumeFile) {
        setError('Please upload a resume file.');
        return;
      }
      resumeInput = resumeFile;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setIsCachedResult(false);
    
    try {
      // Add a timestamp parameter to force re-analysis if requested
      const analysis = await matcherService.getMatchAnalysis(
        resumeInput, 
        jobDescription, 
        forceReanalyze ? Date.now() : undefined
      );
      setResult(analysis);
      setAnalysisCount(prev => prev + 1);
      setIsCachedResult(!forceReanalyze && analysisCount > 0);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReanalyze = () => {
    handleMatch(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const toggleResponseGuide = (questionId) => {
    setExpandedGuides(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const matchLabel = result
    ? result.matchScore >= 70
      ? 'Great Match!'
      : result.matchScore >= 40
      ? 'Good Match'
      : 'Needs Work'
    : 'No Data';
  const matchColor = result
    ? result.matchScore >= 70
      ? '#2ECC40'
      : result.matchScore >= 40
      ? '#FFB400'
      : '#FF4B4B'
    : '#E0E0E0';

  const handleExportPDF = () => {
    if (!result) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    let y = 40;
    const left = 40;
    const lineHeight = 18;
    const sectionGap = 24;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxTextWidth = pageWidth - left * 2;

    function ensureSpace(lines = 1, extra = 0) {
      if (y + (lines * lineHeight) + extra > pageHeight - 40) {
        doc.addPage();
        y = 40;
      }
    }

    doc.setFontSize(20);
    doc.text('Match Analysis Result', left, y);
    y += sectionGap;

    // Candidate Info
    doc.setFontSize(14);
    ensureSpace(3);
    doc.text(`Candidate: ${result.name || ''}`, left, y);
    y += lineHeight;
    doc.text(`Current Role: ${result.role || ''}`, left, y);
    y += lineHeight;
    doc.text(`Match Score: ${result.matchScore != null ? result.matchScore + '%' : ''}`, left, y);
    y += lineHeight;
    if (result.summary) {
      ensureSpace(2);
      doc.text('Summary:', left, y);
      y += lineHeight;
      doc.setFontSize(12);
      const summaryLines = doc.splitTextToSize(result.summary, maxTextWidth);
      ensureSpace(summaryLines.length);
      doc.text(summaryLines, left + 10, y);
      y += summaryLines.length * lineHeight;
      y += sectionGap / 2;
      doc.setFontSize(14);
    }

    // Skills Table with autoTable
    if (Array.isArray(result.skills) && result.skills.length > 0) {
      ensureSpace(2);
      doc.text('Skills:', left, y);
      y += lineHeight;
      autoTable(doc, {
        startY: y,
        head: [['Skill', 'Type', 'Status', 'Highlight']],
        body: result.skills.map(skill => [
          skill.name,
          skill.type,
          skill.status ? '✔' : '',
          skill.highlight ? '✔' : ''
        ]),
        margin: { left, right: left },
        styles: { fontSize: 12, cellPadding: 4 },
        headStyles: { fillColor: [44, 62, 80] },
        theme: 'grid',
        didDrawPage: (data) => { y = data.cursor.y + sectionGap; }
      });
    }

    // Keywords
    if (Array.isArray(result.jobKeywords) && result.jobKeywords.length > 0) {
      ensureSpace(2);
      doc.text('Job Description Keywords:', left, y);
      y += lineHeight;
      doc.setFontSize(12);
      const kwLines = doc.splitTextToSize(result.jobKeywords.map(k => k.word).join(', '), maxTextWidth);
      ensureSpace(kwLines.length);
      doc.text(kwLines, left + 10, y);
      y += kwLines.length * lineHeight;
      y += sectionGap / 2;
      doc.setFontSize(14);
    }

    // Missing Skills
    if (Array.isArray(result.missingForPerfectMatch) && result.missingForPerfectMatch.length > 0) {
      ensureSpace(2);
      doc.text('Missing Skills & Recommendations:', left, y);
      y += lineHeight;
      doc.setFontSize(12);
      result.missingForPerfectMatch.forEach(item => {
        const lines = doc.splitTextToSize('- ' + item, maxTextWidth);
        ensureSpace(lines.length);
        doc.text(lines, left + 10, y);
        y += lines.length * lineHeight;
      });
      y += sectionGap / 2;
      doc.setFontSize(14);
    }

    // Improvement Suggestions
    if (Array.isArray(result.improvementSuggestions) && result.improvementSuggestions.length > 0) {
      ensureSpace(2);
      doc.text('Personalized Improvement Suggestions:', left, y);
      y += lineHeight;
      doc.setFontSize(12);
      result.improvementSuggestions.forEach(item => {
        const lines = doc.splitTextToSize('- ' + item, maxTextWidth);
        ensureSpace(lines.length);
        doc.text(lines, left + 10, y);
        y += lines.length * lineHeight;
      });
      y += sectionGap / 2;
      doc.setFontSize(14);
    }

    // What Matters Most
    if (result.whatMattersMost) {
      ensureSpace(2);
      doc.text('What Matters Most:', left, y);
      y += lineHeight;
      doc.setFontSize(12);
      const mattersLines = doc.splitTextToSize(result.whatMattersMost, maxTextWidth);
      ensureSpace(mattersLines.length);
      doc.text(mattersLines, left + 10, y);
      y += mattersLines.length * lineHeight;
      y += sectionGap / 2;
      doc.setFontSize(14);
    }

    // Interview Questions
    if (result.interviewQuestions) {
      ensureSpace(2);
      doc.text('Interview Preparation Questions', left, y);
      y += sectionGap;
      // Behavioral
      if (Array.isArray(result.interviewQuestions.behavioral)) {
        doc.setFontSize(13);
        ensureSpace(2);
        doc.text('Behavioral Questions:', left, y);
        y += lineHeight;
        result.interviewQuestions.behavioral.forEach((q, idx) => {
          const question = typeof q === 'string' ? q : q.question;
          doc.setFontSize(12);
          const qLines = doc.splitTextToSize(`${idx + 1}. ${question}`, maxTextWidth - 20);
          ensureSpace(qLines.length);
          doc.text(qLines, left + 10, y);
          y += qLines.length * lineHeight;
          if (typeof q === 'object' && q.responseGuide) {
            doc.setFontSize(11);
            if (q.responseGuide.framework) {
              const fwLines = doc.splitTextToSize(`Framework: ${q.responseGuide.framework}`, maxTextWidth - 30);
              ensureSpace(fwLines.length);
              doc.text(fwLines, left + 20, y);
              y += fwLines.length * lineHeight;
            }
            if (q.responseGuide.structure) {
              ensureSpace(1);
              doc.text('Structure:', left + 20, y);
              y += lineHeight;
              q.responseGuide.structure.forEach((step, sidx) => {
                const stepLines = doc.splitTextToSize(`- ${step}`, maxTextWidth - 40);
                ensureSpace(stepLines.length);
                doc.text(stepLines, left + 30, y);
                y += stepLines.length * lineHeight;
              });
            }
            if (q.responseGuide.keyPoints) {
              ensureSpace(1);
              doc.text('Key Points:', left + 20, y);
              y += lineHeight;
              q.responseGuide.keyPoints.forEach((point, pidx) => {
                const pointLines = doc.splitTextToSize(`- ${point}`, maxTextWidth - 40);
                ensureSpace(pointLines.length);
                doc.text(pointLines, left + 30, y);
                y += pointLines.length * lineHeight;
              });
            }
            if (q.responseGuide.examplePhrases) {
              ensureSpace(1);
              doc.text('Example Phrases:', left + 20, y);
              y += lineHeight;
              q.responseGuide.examplePhrases.forEach((phrase, eidx) => {
                const phraseLines = doc.splitTextToSize(`- "${phrase}"`, maxTextWidth - 40);
                ensureSpace(phraseLines.length);
                doc.text(phraseLines, left + 30, y);
                y += phraseLines.length * lineHeight;
              });
            }
          }
          y += 6;
        });
        y += sectionGap;
      }
      // Technical
      if (Array.isArray(result.interviewQuestions.technical)) {
        doc.setFontSize(13);
        ensureSpace(2);
        doc.text('Technical Questions:', left, y);
        y += lineHeight;
        result.interviewQuestions.technical.forEach((q, idx) => {
          const question = typeof q === 'string' ? q : q.question;
          doc.setFontSize(12);
          const qLines = doc.splitTextToSize(`${idx + 1}. ${question}`, maxTextWidth - 20);
          ensureSpace(qLines.length);
          doc.text(qLines, left + 10, y);
          y += qLines.length * lineHeight;
          if (typeof q === 'object' && q.responseGuide) {
            doc.setFontSize(11);
            if (q.responseGuide.framework) {
              const fwLines = doc.splitTextToSize(`Framework: ${q.responseGuide.framework}`, maxTextWidth - 30);
              ensureSpace(fwLines.length);
              doc.text(fwLines, left + 20, y);
              y += fwLines.length * lineHeight;
            }
            if (q.responseGuide.structure) {
              ensureSpace(1);
              doc.text('Structure:', left + 20, y);
              y += lineHeight;
              q.responseGuide.structure.forEach((step, sidx) => {
                const stepLines = doc.splitTextToSize(`- ${step}`, maxTextWidth - 40);
                ensureSpace(stepLines.length);
                doc.text(stepLines, left + 30, y);
                y += stepLines.length * lineHeight;
              });
            }
            if (q.responseGuide.keyPoints) {
              ensureSpace(1);
              doc.text('Key Points:', left + 20, y);
              y += lineHeight;
              q.responseGuide.keyPoints.forEach((point, pidx) => {
                const pointLines = doc.splitTextToSize(`- ${point}`, maxTextWidth - 40);
                ensureSpace(pointLines.length);
                doc.text(pointLines, left + 30, y);
                y += pointLines.length * lineHeight;
              });
            }
            if (q.responseGuide.examplePhrases) {
              ensureSpace(1);
              doc.text('Example Phrases:', left + 20, y);
              y += lineHeight;
              q.responseGuide.examplePhrases.forEach((phrase, eidx) => {
                const phraseLines = doc.splitTextToSize(`- "${phrase}"`, maxTextWidth - 40);
                ensureSpace(phraseLines.length);
                doc.text(phraseLines, left + 30, y);
                y += phraseLines.length * lineHeight;
              });
            }
          }
          y += 6;
        });
        y += sectionGap;
      }
    }

    doc.save('match-result.pdf');
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg)', overflowX: 'auto', padding: '2rem 0.5rem' }}>
      {result && (
        <Flex mb={2} gap={2} align="center">
          <IconButton
            aria-label="Reset Matcher"
            icon={<FiRefreshCw />}
            size="sm"
            variant="ghost"
            onClick={() => {
              setResult(null);
              localStorage.removeItem('matcherResult');
            }}
            _hover={{ bg: 'gray.200', color: 'teal.500' }}
            title="Reset search and start over"
          />
          <Button
            size="sm"
            colorScheme="teal"
            variant="outline"
            onClick={handleExportPDF}
          >
            Export as PDF
          </Button>
        </Flex>
      )}
      <div ref={exportRef}>
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(4, minmax(0, 1fr))' }}
          templateRows={{ base: 'none', md: 'repeat(2, 1fr)' }}
          gap={6}
          width="100%"
          maxW="1600px"
          mx="auto"
          mb="4rem"
          bg="var(--color-bg-alt)"
          borderRadius="1.5rem"
          boxShadow="0 4px 32px 0 rgba(31,38,135,0.10)"
          p={{ base: '1rem', md: '2rem' }}
          style={{ maxWidth: '100vw', overflowX: 'auto' }}
        >
          {/* Resume Source Selection */}
          <GridItem colSpan={{ base: 1, md: 1 }} rowSpan={1}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Resume Source</h2>
              <RadioGroup value={resumeSource} onChange={setResumeSource} mb={2}>
                <Stack direction="column" spacing={2}>
                  <Radio value="current">Use my current uploaded document</Radio>
                  <Radio value="upload">Upload a new resume for this match</Radio>
                </Stack>
              </RadioGroup>
              {resumeSource === 'current' && (
                docLoading ? (
                  <Flex align="center" gap={2}><Spinner size="sm" /> Loading your document...</Flex>
                ) : currentDoc ? (
                  <Text fontSize="sm" fontWeight="medium">Using: <b>{currentDoc.title}</b></Text>
                ) : (
                  <Text color={errorColor} fontSize="sm">No document found. Please upload one in the Documents section.</Text>
                )
              )}
              {resumeSource === 'upload' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                  <Box
                    as="button"
                    p={0}
                    border="none"
                    bg="none"
                    onClick={() => fileInputRef.current.click()}
                    _hover={{ opacity: 0.8 }}
                    cursor="pointer"
                  >
                    <Center
                      borderWidth="2px"
                      borderRadius="md"
                      borderStyle="dashed"
                      borderColor={isDragging ? 'teal.400' : useColorModeValue('gray.300', 'gray.600')}
                      bg={isDragging ? 'teal.50' : 'var(--color-bg-alt)'}
                      w="44px"
                      h="44px"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx"
                      />
                      <Icon as={FiUploadCloud} boxSize={7} color="teal.400" />
                    </Center>
                  </Box>
                  <Text fontWeight="medium" fontSize="sm" textAlign="left">
                    {resumeFile ? `Selected: ${resumeFile.name}` : 'Click or drag & drop your resume'}
                  </Text>
                </div>
              )}
            </div>
          </GridItem>

          {/* Job Description */}
          <GridItem colSpan={{ base: 1, md: 2 }} rowSpan={1}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Job Description</h3>
              <Textarea
                placeholder="Paste or write the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                height="70px"
                bg="var(--color-bg-alt)"
                borderColor={dividerColor}
                fontSize="sm"
                resize="none"
                mb={2}
                w="100%"
                style={{ color: colorMode === 'dark' ? 'white' : textColor }}
              />
              <Button
                colorScheme="teal"
                size="md"
                w="100%"
                borderRadius="full"
                fontWeight="bold"
                onClick={() => handleMatch()}
                isLoading={isLoading}
                loadingText="Analyzing..."
                disabled={
                  isLoading ||
                  !jobDescription ||
                  (resumeSource === 'current' ? (!currentDoc || !currentDoc.content) : !resumeFile)
                }
                mt={1}
              >
                {isLoading ? (
                  <LoadingSpinner size="small" color="primary" />
                ) : (
                  "Analyze Match"
                )}
              </Button>
              
              {/* Re-analyze button and cache indicator */}
              {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {isCachedResult && (
                    <Text fontSize="xs" color="blue.500" textAlign="center">
                      📋 Using cached result for consistency
                    </Text>
                  )}
                  <Button
                    colorScheme="blue"
                    size="sm"
                    w="100%"
                    borderRadius="full"
                    fontWeight="medium"
                    onClick={handleReanalyze}
                    disabled={isLoading}
                    variant="outline"
                  >
                    🔄 Re-analyze (Fresh AI Analysis)
                  </Button>
                </div>
              )}

              {/* Show backend error messages clearly */}
              {error && (
                <Box mt={3} p={3} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                  <Text fontWeight="bold" fontSize="sm">{error}</Text>
                </Box>
              )}
            </div>
          </GridItem>

          {/* Job Description Keywords */}
          <GridItem colSpan={{ base: 1, md: 1 }} rowSpan={1}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Job Description Keywords</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', width: '100%' }}>
                {result?.jobKeywords && result.jobKeywords.length > 0 ? (
                  result.jobKeywords.map((kw, idx) => (
                    <Tag
                      key={idx}
                      colorScheme={TAG_COLOR_PALETTE[idx % TAG_COLOR_PALETTE.length]}
                      borderRadius="full"
                      px={3}
                      fontWeight="bold"
                      fontSize="sm"
                      variant="solid"
                    >
                      <TagLabel>{kw.word}</TagLabel>
                    </Tag>
                  ))
                ) : (
                  <Text fontSize="sm">No keywords extracted.</Text>
                )}
              </div>
            </div>
          </GridItem>

          {/* Candidate Info & Match Score */}
          <GridItem colSpan={{ base: 1, md: 1 }} rowSpan={2}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Candidate</h2>
              <Text fontWeight="bold" fontSize="md" mb={1} textAlign="left" w="100%">
                {result?.name || 'Candidate Name'}
              </Text>
              <Text fontWeight="medium" fontSize="sm" mb={2} textAlign="left" w="100%">
                {result?.role || 'Current Role'}
              </Text>
              <Divider my={1} w="100%" borderColor={dividerColor} />
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Match Score</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', width: '100%' }}>
                <div style={{ width: '60px', height: '60px', transition: 'all 0.3s' }}>
                  <CircularProgressbarWithChildren
                    value={result ? result.matchScore : 0}
                    maxValue={100}
                    strokeWidth={8}
                    styles={buildStyles({
                      // Use a vibrant gradient or alternate color for the path
                      pathColor: result
                        ? `url(#matchGradient)`
                        : useColorModeValue('#E0E0E0', '#222'),
                      trailColor: useColorModeValue('#E0E0E0', '#222'),
                      textColor: headingColor,
                      backgroundColor: 'var(--color-bg-alt)',
                      transition: 'stroke-dashoffset 0.5s ease',
                    })}
                  >
                    {/* SVG Gradient Defs for the progress bar */}
                    <svg style={{ height: 0 }}>
                      <defs>
                        <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#38B2AC" /> {/* teal.400 */}
                          <stop offset="50%" stopColor="#805AD5" /> {/* purple.500 */}
                          <stop offset="100%" stopColor="#F6AD55" /> {/* orange.300 */}
                        </linearGradient>
                      </defs>
                    </svg>
                    <Text fontSize="md" fontWeight="extrabold" color={matchColor} letterSpacing="tight">
                      {result ? `${result.matchScore}%` : '--'}
                    </Text>
                  </CircularProgressbarWithChildren>
                </div>
              </div>
              {result && (
                <Text fontSize="sm" mb={1} color={subTextColor} textAlign="left" w="100%">
                  {result.summary}
                </Text>
              )}
            </div>
          </GridItem>

          {/* Hard Skills (make wider) */}
          <GridItem colSpan={{ base: 1, md: 2 }} rowSpan={1}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Hard Skills</h3>
              <div style={{ borderRadius: 'lg', backgroundColor: tagBg, padding: '0.5rem', boxShadow: 'sm', width: '100%', height: '100%', overflow: 'hidden' }}>
                <div style={{ display: 'flex', fontWeight: 'bold', color: subTextColor, marginBottom: '0.25rem', fontSize: 'sm', width: '100%' }}>
                  <div style={{ flex: 2, textAlign: 'left' }}>Skill</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>Status</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>Highlight</div>
                </div>
                {Array.isArray(result?.skills) && result.skills.length > 0 ? (
                  result.skills.map((skill) => (
                    <div key={skill.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', fontSize: 'sm', width: '100%' }}>
                      <div style={{ flex: 2, fontWeight: 'medium', textAlign: 'left' }}>
                        <Tag colorScheme={SKILL_COLORS[skill.type]} borderRadius="full" mr={2}>{skill.name}</Tag>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <Switch isChecked={skill.status} colorScheme="teal" isReadOnly size="sm" />
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <Switch isChecked={skill.highlight} colorScheme="yellow" isReadOnly size="sm" />
                      </div>
                    </div>
                  ))
                ) : (
                  <Text fontSize="sm">No skills extracted.</Text>
                )}
              </div>
            </div>
          </GridItem>

          {/* Group: Missing Skills & Recommendations + Personalized Improvement Suggestions */}
          <GridItem colSpan={{ base: 1, md: 2 }} rowSpan={1}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Missing Skills & Recommendations</h3>
                  <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                    {result?.missingForPerfectMatch && result.missingForPerfectMatch.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                        {result.missingForPerfectMatch.map((item, idx) => (
                          <div key={idx} style={{ 
                            padding: '0.75rem', 
                            backgroundColor: 'var(--color-bg-alt)', 
                            borderRadius: '0.5rem', 
                            border: '1px solid var(--color-border)',
                            width: '100%'
                          }}>
                            <Text fontSize="sm" fontWeight="medium">
                              {item}
                            </Text>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text fontSize="sm">No missing elements for a perfect match!</Text>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Personalized Improvement Suggestions</h3>
                  <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
                    {result?.improvementSuggestions && result.improvementSuggestions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                        {result.improvementSuggestions.map((suggestion, idx) => (
                          <div key={idx} style={{ 
                            padding: '0.75rem', 
                            backgroundColor: 'var(--color-bg-alt)', 
                            borderRadius: '0.5rem', 
                            border: '1px solid var(--color-border)',
                            width: '100%'
                          }}>
                            <Text fontSize="sm" fontWeight="medium">
                              {suggestion}
                            </Text>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text fontSize="sm">No improvement suggestions available.</Text>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GridItem>

          {/* What Matters Most (make wider) */}
          <GridItem colSpan={{ base: 1, md: 2 }} rowSpan={1}>
            <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>What Matters Most</h3>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start' }}>
                {result?.whatMattersMost ? (
                  <div style={{ 
                    padding: '1rem', 
                    backgroundColor: 'var(--color-bg-alt)', 
                    borderRadius: '0.5rem', 
                    border: '1px solid var(--color-border)',
                    width: '100%',
                    minHeight: '80px'
                  }}>
                    <Text fontSize="sm" fontWeight="medium" lineHeight="1.5">
                      {result.whatMattersMost}
                    </Text>
                  </div>
                ) : (
                  <Text fontSize="sm">No priority requirements identified.</Text>
                )}
              </div>
            </div>
          </GridItem>
        </Grid>

        {/* Interview Questions Section */}
        {result && result.interviewQuestions && (
          <Box
            width="100%"
            maxW="1600px"
            mx="auto"
            mt="2rem"
            bg="var(--color-bg-alt)"
            borderRadius="1.5rem"
            boxShadow="0 4px 32px 0 rgba(31,38,135,0.10)"
            p={{ base: '1rem', md: '2rem' }}
          >
            <Heading 
              size="lg" 
              mb={6} 
              style={{ color: 'var(--color-text)' }}
              textAlign="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
            >
              🎯 Interview Preparation Questions
            </Heading>
            
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
              {/* Behavioral Questions */}
              <Box>
                <Heading size="md" mb={4} style={{ color: 'var(--color-text)' }} display="flex" alignItems="center" gap={2}>
                  💬 Behavioral Questions
                  <Tag colorScheme="blue" size="sm" borderRadius="full">
                    {result.interviewQuestions.behavioral?.length || 0} questions
                  </Tag>
                </Heading>
                <Box mb={4} p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                  <Text fontSize="sm" color="blue.800" fontWeight="medium">
                    💡 <strong>Tip:</strong> Use the STAR method (Situation, Task, Action, Result) to structure your answers. 
                    Focus on specific examples that demonstrate your soft skills and problem-solving abilities.
                  </Text>
                </Box>
                <Stack spacing={4}>
                  {result.interviewQuestions.behavioral?.map((question, idx) => (
                    <Box
                      key={idx}
                      p={4}
                      bg="var(--color-card)"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={dividerColor}
                      boxShadow="sm"
                    >
                      <Flex align="start" gap={3}>
                        <Tag colorScheme="blue" size="sm" borderRadius="full" minW="24px" justifyContent="center">
                          {idx + 1}
                        </Tag>
                        <Text fontSize="md" fontWeight="medium" lineHeight="1.6">
                          {typeof question === 'string' ? question : question.question}
                        </Text>
                      </Flex>
                      
                      {/* Response Guide */}
                      {typeof question === 'object' && question.responseGuide && (
                        <Box mt={4}>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => toggleResponseGuide(`behavioral-${idx}`)}
                            mb={3}
                            leftIcon={expandedGuides.has(`behavioral-${idx}`) ? <Icon as={() => '▼'} /> : <Icon as={() => '▶'} />}
                          >
                            {expandedGuides.has(`behavioral-${idx}`) ? 'Hide Response Guide' : 'Show Response Guide'}
                          </Button>
                          
                          {expandedGuides.has(`behavioral-${idx}`) && (
                            <Box
                              p={4}
                              bg="blue.50"
                              borderRadius="md"
                              border="1px solid"
                              borderColor="blue.200"
                            >
                              {/* Framework */}
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" color="blue.800" mb={1}>
                                  Framework: {question.responseGuide.framework}
                                </Text>
                              </Box>
                              
                              {/* Structure */}
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" color="blue.800" mb={2}>
                                  Structure:
                                </Text>
                                <Stack spacing={1}>
                                  {question.responseGuide.structure?.map((step, stepIdx) => (
                                    <Flex key={stepIdx} align="start" gap={2}>
                                      <Tag size="xs" colorScheme="blue" borderRadius="full" minW="16px" justifyContent="center">
                                        {stepIdx + 1}
                                      </Tag>
                                      <Text fontSize="sm" color="blue.700">
                                        {step}
                                      </Text>
                                    </Flex>
                                  ))}
                                </Stack>
                              </Box>
                              
                              {/* Key Points */}
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" color="blue.800" mb={2}>
                                  Key Points to Emphasize:
                                </Text>
                                <Stack spacing={1}>
                                  {question.responseGuide.keyPoints?.map((point, pointIdx) => (
                                    <Flex key={pointIdx} align="start" gap={2}>
                                      <Icon as={() => '•'} color="blue.500" mt={1} />
                                      <Text fontSize="sm" color="blue.700">
                                        {point}
                                      </Text>
                                    </Flex>
                                  ))}
                                </Stack>
                              </Box>
                              
                              {/* Example Phrases */}
                              <Box>
                                <Text fontSize="sm" fontWeight="bold" color="blue.800" mb={2}>
                                  Example Phrases:
                                </Text>
                                <Stack spacing={1}>
                                  {question.responseGuide.examplePhrases?.map((phrase, phraseIdx) => (
                                    <Box key={phraseIdx} p={2} bg="white" borderRadius="sm" border="1px solid" borderColor="blue.300">
                                      <Text fontSize="sm" color="blue.800" fontStyle="italic">
                                        "{phrase}"
                                      </Text>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Technical Questions */}
              <Box>
                <Heading size="md" mb={4} style={{ color: 'var(--color-text)' }} display="flex" alignItems="center" gap={2}>
                  🔧 Technical Questions
                  <Tag colorScheme="orange" size="sm" borderRadius="full">
                    {result.interviewQuestions.technical?.length || 0} questions
                  </Tag>
                </Heading>
                <Box mb={4} p={4} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
                  <Text fontSize="sm" color="orange.800" fontWeight="medium">
                    💡 <strong>Tip:</strong> Be prepared to discuss your technical experience, problem-solving approach, 
                    and how you stay updated with industry trends. Include specific examples of projects or challenges you've tackled.
                  </Text>
                </Box>
                <Stack spacing={4}>
                  {result.interviewQuestions.technical?.map((question, idx) => (
                    <Box
                      key={idx}
                      p={4}
                      bg="var(--color-card)"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={dividerColor}
                      boxShadow="sm"
                    >
                      <Flex align="start" gap={3}>
                        <Tag colorScheme="orange" size="sm" borderRadius="full" minW="24px" justifyContent="center">
                          {idx + 1}
                        </Tag>
                        <Text fontSize="md" fontWeight="medium" lineHeight="1.6">
                          {typeof question === 'string' ? question : question.question}
                        </Text>
                      </Flex>
                      
                      {/* Response Guide */}
                      {typeof question === 'object' && question.responseGuide && (
                        <Box mt={4}>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="orange"
                            onClick={() => toggleResponseGuide(`technical-${idx}`)}
                            mb={3}
                            leftIcon={expandedGuides.has(`technical-${idx}`) ? <Icon as={() => '▼'} /> : <Icon as={() => '▶'} />}
                          >
                            {expandedGuides.has(`technical-${idx}`) ? 'Hide Response Guide' : 'Show Response Guide'}
                          </Button>
                          
                          {expandedGuides.has(`technical-${idx}`) && (
                            <Box
                              p={4}
                              bg="orange.50"
                              borderRadius="md"
                              border="1px solid"
                              borderColor="orange.200"
                            >
                              {/* Framework */}
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" color="orange.800" mb={1}>
                                  Framework: {question.responseGuide.framework}
                                </Text>
                              </Box>
                              
                              {/* Structure */}
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" color="orange.800" mb={2}>
                                  Structure:
                                </Text>
                                <Stack spacing={1}>
                                  {question.responseGuide.structure?.map((step, stepIdx) => (
                                    <Flex key={stepIdx} align="start" gap={2}>
                                      <Tag size="xs" colorScheme="orange" borderRadius="full" minW="16px" justifyContent="center">
                                        {stepIdx + 1}
                                      </Tag>
                                      <Text fontSize="sm" color="orange.700">
                                        {step}
                                      </Text>
                                    </Flex>
                                  ))}
                                </Stack>
                              </Box>
                              
                              {/* Key Points */}
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" color="orange.800" mb={2}>
                                  Key Points to Emphasize:
                                </Text>
                                <Stack spacing={1}>
                                  {question.responseGuide.keyPoints?.map((point, pointIdx) => (
                                    <Flex key={pointIdx} align="start" gap={2}>
                                      <Icon as={() => '•'} color="orange.500" mt={1} />
                                      <Text fontSize="sm" color="orange.700">
                                        {point}
                                      </Text>
                                    </Flex>
                                  ))}
                                </Stack>
                              </Box>
                              
                              {/* Example Phrases */}
                              <Box>
                                <Text fontSize="sm" fontWeight="bold" color="orange.800" mb={2}>
                                  Example Phrases:
                                </Text>
                                <Stack spacing={1}>
                                  {question.responseGuide.examplePhrases?.map((phrase, phraseIdx) => (
                                    <Box key={phraseIdx} p={2} bg="white" borderRadius="sm" border="1px solid" borderColor="orange.300">
                                      <Text fontSize="sm" color="orange.800" fontStyle="italic">
                                        "{phrase}"
                                      </Text>
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Box>
        )}
      </div>
    </div>
  );
};

export default MatcherPage; 