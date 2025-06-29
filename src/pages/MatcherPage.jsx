import { useState, useRef } from 'react';
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
} from '@chakra-ui/react';
import { FiUploadCloud } from 'react-icons/fi';
import { matcherService } from '../services/matcherService';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LoadingSpinner from '../components/LoadingSpinner';

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

  const handleMatch = async (forceReanalyze = false) => {
    if (!resumeFile) {
      setError('Please upload a resume file.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setIsCachedResult(false);
    
    try {
      // Add a timestamp parameter to force re-analysis if requested
      const analysis = await matcherService.getMatchAnalysis(
        resumeFile, 
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

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-bg)', overflowX: 'auto', padding: '2rem 0.5rem' }}>
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
        {/* Upload Resume */}
        <GridItem colSpan={{ base: 1, md: 1 }} rowSpan={1}>
          <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Upload Resume</h2>
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
              <Text color={subTextColor} fontWeight="medium" fontSize="sm" textAlign="left">
                {resumeFile ? `Selected: ${resumeFile.name}` : 'Click or drag & drop your resume'}
              </Text>
            </div>
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
              disabled={!resumeFile || !jobDescription || isLoading}
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

            {error && (
              <Text color={errorColor} mt={2} fontWeight="bold" fontSize="sm">{error}</Text>
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
                <Text color={subTextColor}>No keywords extracted.</Text>
              )}
            </div>
          </div>
        </GridItem>

        {/* Candidate Info & Match Score */}
        <GridItem colSpan={{ base: 1, md: 1 }} rowSpan={2}>
          <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', height: '100%', backgroundColor: 'var(--color-card)', borderRadius: '1rem', boxShadow: '0 2px 12px 0 rgba(31, 38, 135, 0.10)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', width: '100%' }}>Candidate</h2>
            <Text color={headingColor} fontWeight="bold" fontSize="md" mb={1} textAlign="left" w="100%">
              {result?.name || 'Candidate Name'}
            </Text>
            <Text color={subTextColor} fontWeight="medium" fontSize="sm" mb={2} textAlign="left" w="100%">
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
                <Text color={subTextColor}>No skills extracted.</Text>
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
                          <Text color={textColor} fontSize="sm" fontWeight="medium">
                            {item}
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text color={subTextColor} fontSize="sm">No missing elements for a perfect match!</Text>
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
                          <Text color={textColor} fontSize="sm" fontWeight="medium">
                            {suggestion}
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text color={subTextColor} fontSize="sm">No improvement suggestions available.</Text>
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
                  <Text color={textColor} fontSize="sm" fontWeight="medium" lineHeight="1.5">
                    {result.whatMattersMost}
                  </Text>
                </div>
              ) : (
                <Text color={subTextColor} fontSize="sm">No priority requirements identified.</Text>
              )}
            </div>
          </div>
        </GridItem>
      </Grid>
    </div>
  );
};

export default MatcherPage; 